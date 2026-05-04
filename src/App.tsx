import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { UserProfile } from "./types";
import Auth from "./components/Auth";
import MiningGame from "./components/MiningGame";
import DepositSection from "./components/DepositSection";
import WithdrawSection from "./components/WithdrawSection";
import AdminPanel from "./components/AdminPanel";
import { 
  LogOut, 
  Pickaxe, 
  LayoutDashboard, 
  ShieldCheck, 
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"game" | "deposit" | "withdraw" | "admin">("game");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let unsubDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous document listener if it exists
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        unsubDoc = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUser(doc.data() as UserProfile);
          } else {
            console.warn("User profile document not found for:", firebaseUser.uid);
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore onSnapshot error:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={setUser} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-yellow-500/30">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Pickaxe className="w-6 h-6 text-black" />
           </div>
           <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-tight">BEST MINING HUB</h1>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Mining Empire v1.0</span>
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <button 
                onClick={() => setActiveTab("game")}
                className={`transition-colors flex items-center gap-2 ${activeTab === 'game' ? 'text-yellow-500' : 'text-zinc-400 hover:text-white'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Mining
              </button>
              <button 
                onClick={() => setActiveTab("deposit")}
                className={`transition-colors flex items-center gap-2 ${activeTab === 'deposit' ? 'text-yellow-500' : 'text-zinc-400 hover:text-white'}`}
              >
                <ArrowDownCircle className="w-4 h-4" /> Deposit
              </button>
              <button 
                onClick={() => setActiveTab("withdraw")}
                className={`transition-colors flex items-center gap-2 ${activeTab === 'withdraw' ? 'text-yellow-500' : 'text-zinc-400 hover:text-white'}`}
              >
                <ArrowUpCircle className="w-4 h-4" /> Withdraw
              </button>
              {user.isAdmin && (
                <button 
                  onClick={() => setActiveTab("admin")}
                  className={`transition-colors flex items-center gap-2 ${activeTab === 'admin' ? 'text-yellow-500' : 'text-zinc-400 hover:text-white'}`}
                >
                  <ShieldCheck className="w-4 h-4" /> Admin
                </button>
              )}
           </div>

           <div className="flex items-center gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-full pl-4 pr-1 py-1 flex items-center gap-3">
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] text-zinc-500 font-bold leading-none">BALANCE</span>
                    <span className="text-sm font-mono font-bold text-yellow-500">{user.balance.toLocaleString()} PKR</span>
                 </div>
                 <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                    <Wallet className="w-4 h-4" />
                 </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button 
                className="md:hidden text-zinc-400"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
           </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-zinc-950 pt-24 px-6 md:hidden"
          >
            <div className="space-y-4">
               <button 
                 onClick={() => { setActiveTab("game"); setMobileMenuOpen(false); }}
                 className="w-full text-left p-4 bg-zinc-900 rounded-2xl flex items-center gap-3 font-bold text-lg"
               >
                 <LayoutDashboard className="text-yellow-500" /> Mining Site
               </button>
               <button 
                 onClick={() => { setActiveTab("deposit"); setMobileMenuOpen(false); }}
                 className="w-full text-left p-4 bg-zinc-900 rounded-2xl flex items-center gap-3 font-bold text-lg"
               >
                 <ArrowDownCircle className="text-yellow-500" /> Deposit
               </button>
               <button 
                 onClick={() => { setActiveTab("withdraw"); setMobileMenuOpen(false); }}
                 className="w-full text-left p-4 bg-zinc-900 rounded-2xl flex items-center gap-3 font-bold text-lg"
               >
                 <ArrowUpCircle className="text-yellow-500" /> Withdraw
               </button>
               {user.isAdmin && (
                 <button 
                   onClick={() => { setActiveTab("admin"); setMobileMenuOpen(false); }}
                   className="w-full text-left p-4 bg-zinc-900 rounded-2xl flex items-center gap-3 font-bold text-lg border border-yellow-500/20"
                 >
                   <ShieldCheck className="text-yellow-500" /> Admin Portal
                 </button>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-12">
         <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "game" && <MiningGame user={user} />}
              {activeTab === "deposit" && <DepositSection user={user} />}
              {activeTab === "withdraw" && <WithdrawSection user={user} />}
              {activeTab === "admin" && user.isAdmin && <AdminPanel />}
            </motion.div>
         </AnimatePresence>
      </main>

      <footer className="mt-auto border-t border-zinc-900 py-8 px-6 text-center text-zinc-600 text-xs">
        &copy; 2026 Best Mining Hub. Built for secure crypto operations.
      </footer>
    </div>
  );
}
