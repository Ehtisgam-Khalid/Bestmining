import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { 
  Gem, 
  Bomb, 
  Lock, 
  Play, 
  Wallet, 
  CheckCircle2, 
  AlertTriangle,
  Coins,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/utils";

interface MiningGameProps {
  user: UserProfile;
}

type CellState = "hidden" | "diamond" | "boom";

export default function MiningGame({ user }: MiningGameProps) {
  const [gameState, setGameState] = useState<"idle" | "playing" | "ended">("idle");
  const [grid, setGrid] = useState<{ type: "diamond" | "boom", state: CellState }[]>([]);
  const [currentWin, setCurrentWin] = useState(0);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(50);
  const [loading, setLoading] = useState(false);

  const GRID_SIZE = 19;
  const BOMB_COUNT = 4;
  const WIN_MULTIPLIER = 0.2; // 20% of bet per diamond

  const initGame = () => {
    const newGrid: { type: "diamond" | "boom", state: CellState }[] = [];
    const bombIndices = new Set<number>();
    while (bombIndices.size < BOMB_COUNT) {
      bombIndices.add(Math.floor(Math.random() * GRID_SIZE));
    }

    for (let i = 0; i < GRID_SIZE; i++) {
      newGrid.push({
        type: bombIndices.has(i) ? "boom" : "diamond",
        state: "hidden"
      });
    }
    return newGrid;
  };

  const startGame = async () => {
    if (user.balance < betAmount) {
      setLastAction("Insufficient balance to start game!");
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(-betAmount)
      });
      setGrid(initGame());
      setCurrentWin(0);
      setGameState("playing");
      setLastAction(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      setLastAction("Failed to start game. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = async (index: number) => {
    if (gameState !== "playing" || grid[index].state !== "hidden") return;

    const newGrid = [...grid];
    const cell = newGrid[index];
    const diamondWin = betAmount * WIN_MULTIPLIER;
    
    // Rigged Logic: 95% lose rate
    // Only 5% of clicks can result in a diamond if we want to be strictly 95% lose
    // However, to make it even harder, we force a boom 95% of the time on any click.
    const isWinGame = Math.random() < 0.05;

    if (!isWinGame) {
      // Force Boom on first or second click
      cell.type = "boom";
      cell.state = "boom";
      newGrid.forEach(c => c.state = c.type);
      setGrid(newGrid);
      setGameState("ended");
      setLastAction(`BOOM! Lost ${betAmount} PKR.`);
      
      // Increment game count
      try {
        await updateDoc(doc(db, "users", user.uid), {
          gameCount: increment(1)
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      // It's a Win Game
      if (cell.type === "boom") {
        // Switch it to diamond to ensure win
        cell.type = "diamond";
      }
      
      cell.state = "diamond";
      setGrid(newGrid);
      setCurrentWin(prev => prev + diamondWin);
      
      const hiddenDiamonds = newGrid.filter(c => c.type === "diamond" && c.state === "hidden");
      if (hiddenDiamonds.length === 0) {
        handleCashOut(currentWin + diamondWin);
      }
    }
  };

  const handleCashOut = async (amountToWin = currentWin) => {
    if (gameState !== "playing") return;
    setLoading(true);
    try {
      const totalReturn = betAmount + amountToWin;
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(totalReturn),
        gameCount: increment(1)
      });
      setGameState("ended");
      setLastAction(`Cashed out! Won ${totalReturn.toFixed(0)} PKR`);
      const revealedGrid = grid.map(c => ({ ...c, state: c.type }));
      setGrid(revealedGrid);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  if (user.balance < 50 && gameState === "idle") {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-zinc-950 rounded-full flex items-center justify-center mb-6 border border-zinc-800 shadow-2xl">
            <Lock className="w-10 h-10 text-zinc-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Game Locked</h2>
          <p className="text-zinc-400 max-w-xs mx-auto text-sm leading-relaxed">
            Minimum balance of <span className="text-yellow-500 font-bold">50 PKR</span> required to play the Diamond Mine.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-4 opacity-10">
           {Array(16).fill(0).map((_, i) => (
             <div key={i} className="aspect-square bg-zinc-800 rounded-xl" />
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bet Selection Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
           <Gem className="text-yellow-500" />
           Diamond Mine Arcade
        </h2>
        
        {gameState === "idle" && (
          <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
             {[50, 100, 200, 500].map(amount => (
               <button
                 key={amount}
                 onClick={() => setBetAmount(amount)}
                 className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                   betAmount === amount 
                     ? "bg-yellow-500 text-black shadow-lg" 
                     : "text-zinc-500 hover:text-white"
                 }`}
               >
                 {amount} PKR
               </button>
             ))}
          </div>
        )}
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest block">Active Bet</span>
            <span className="text-lg font-bold text-white">{gameState === 'playing' ? betAmount : betAmount} PKR</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
            <Gem className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest block">Current Win</span>
            <span className="text-lg font-bold text-white">+{currentWin.toFixed(0)} PKR</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest block">Your Balance</span>
            <span className="text-lg font-bold text-white">{user.balance.toLocaleString()} PKR</span>
          </div>
        </div>
      </div>

      {/* Main Game Board */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 relative">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3 mb-8">
          {gameState === "idle" || (gameState === "ended" && !grid.length) ? (
            Array(GRID_SIZE).fill(0).map((_, i) => (
              <div 
                key={i} 
                className="aspect-square bg-zinc-800/50 rounded-xl border border-zinc-800 animation-pulse" 
              />
            ))
          ) : (
            grid.map((cell, i) => (
              <motion.button
                key={i}
                whileHover={cell.state === 'hidden' && gameState === 'playing' ? { scale: 1.05, backgroundColor: 'rgba(39, 39, 42, 1)' } : {}}
                whileTap={cell.state === 'hidden' && gameState === 'playing' ? { scale: 0.95 } : {}}
                onClick={() => handleCellClick(i)}
                disabled={cell.state !== "hidden" || gameState !== "playing"}
                className={`aspect-square rounded-xl border flex items-center justify-center transition-all shadow-lg ${
                  cell.state === "hidden" 
                    ? "bg-zinc-800 border-zinc-700 hover:border-yellow-500/50 cursor-pointer text-zinc-500" 
                    : cell.state === "diamond"
                    ? "bg-green-500/20 border-green-500 shadow-green-500/20"
                    : "bg-red-500/20 border-red-500 shadow-red-500/20"
                }`}
              >
                <AnimatePresence mode="wait">
                  {cell.state === "diamond" && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Gem className="w-6 h-6 text-green-500" />
                    </motion.div>
                  )}
                  {cell.state === "boom" && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Bomb className="w-6 h-6 text-red-500" />
                    </motion.div>
                  )}
                  {cell.state === "hidden" && gameState === 'playing' && (
                     <div className="text-[10px] uppercase font-bold opacity-20">Mine</div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))
          )}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-800">
          <div className="text-sm font-medium">
            {lastAction ? (
              <span className={`flex items-center gap-2 ${lastAction.includes('win') || lastAction.includes('won') ? 'text-green-500' : 'text-red-500'}`}>
                {lastAction.includes('BOOM') ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {lastAction}
              </span>
            ) : (
              <span className="text-zinc-500">Pick tiles to multiplier your bet!</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {gameState === "playing" ? (
              <button
                onClick={() => handleCashOut()}
                disabled={loading || currentWin === 0}
                className="flex-1 sm:flex-none px-8 py-3 bg-green-500 hover:bg-green-400 text-black font-extrabold rounded-xl transition-all disabled:opacity-50 shadow-xl shadow-green-500/20"
              >
                CASH OUT ({(betAmount + currentWin).toFixed(0)} PKR)
              </button>
            ) : (
              <button
                onClick={startGame}
                disabled={loading || user.balance < betAmount}
                className="flex-1 sm:flex-none px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-yellow-500/20"
              >
                <Play className="w-5 h-5 fill-current" />
                PLAY {betAmount} PKR
              </button>
            )}
          </div>
        </div>
      </div>

      {/* How to Play Guide */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
           <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
             <HelpCircle className="w-4 h-4 text-yellow-500" />
             Mining Strategy Guide
           </h4>
           <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950 rounded-full border border-zinc-800">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-500">SYSTEM READY</span>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
           <div className="p-6 space-y-3">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
                 <Play className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-white text-sm">Step 1: Set Stake</h5>
              <p className="text-xs text-zinc-500 leading-relaxed">Choose your entry fee (50-500 PKR). Higher stakes mean higher potential payouts per diamond found.</p>
           </div>
           
           <div className="p-6 space-y-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                 <Gem className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-white text-sm">Step 2: Dig Deep</h5>
              <p className="text-xs text-zinc-500 leading-relaxed">Tap the mysterious mining blocks. Every <span className="text-white font-bold">Diamond</span> you unearth adds instant cash to your prize pool.</p>
           </div>

           <div className="p-6 space-y-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                 <Bomb className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-white text-sm">Step 3: Avoid Booms</h5>
              <p className="text-xs text-zinc-500 leading-relaxed">Watch out! There are 4 hidden explosive charges. Hitting one terminates the session and resets your pool.</p>
           </div>

           <div className="p-6 space-y-3 bg-yellow-500/5">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                 <CheckCircle2 className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-white text-sm">Step 4: Cash Out</h5>
              <p className="text-xs text-zinc-500 leading-relaxed">Don't be greedy! You can stop anytime. Hit <span className="text-white font-bold">Cash Out</span> to secure your winnings safely.</p>
           </div>
        </div>

        <div className="p-4 bg-zinc-950/50 flex items-center justify-center gap-6">
           <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Fair Play Check:</span>
              <div className="flex gap-1">
                 {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-3 bg-yellow-500/20 rounded-full" />)}
              </div>
           </div>
           <p className="text-[10px] text-zinc-500 italic">"Fortune favors the bold, but strategy wins the game."</p>
        </div>
      </div>
    </div>
  );
}
