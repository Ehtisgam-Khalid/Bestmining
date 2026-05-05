import React, { useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { UserProfile } from "../types";
import { Mail, Lock, UserPlus, LogIn, Loader2, Pickaxe, ShieldCheck, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

interface AuthProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        if (userDoc.exists()) {
          onAuthSuccess(userDoc.data() as UserProfile);
        } else {
          const profile: UserProfile = {
            uid: userCredential.user.uid,
            email: userCredential.user.email || "",
            balance: 0,
            totalDeposits: 0,
            gameCount: 0,
            isAdmin: userCredential.user.email === "ehtishamarain567@gmail.com",
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", profile.uid), profile);
          onAuthSuccess(profile);
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const profile: UserProfile = {
          uid: userCredential.user.uid,
          email: userCredential.user.email || "",
          balance: 0,
          totalDeposits: 0,
          gameCount: 0,
          isAdmin: userCredential.user.email === "ehtishamarain567@gmail.com",
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", profile.uid), profile);
        onAuthSuccess(profile);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-zinc-950 text-white">
      {/* Left Side: Branding & Info */}
      <div className="hidden lg:flex flex-col justify-center p-12 bg-zinc-900 border-r border-zinc-800">
         <div className="max-w-md mx-auto space-y-12">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-yellow-500/20 rotate-3">
                  <Pickaxe className="w-8 h-8 text-black" />
               </div>
               <div>
                  <h1 className="text-4xl font-black tracking-tighter">BEST MINING HUB</h1>
                  <p className="text-yellow-500 font-bold text-xs uppercase tracking-[0.3em]">Imperial Edition</p>
               </div>
            </div>

            <div className="space-y-8">
               <div className="flex gap-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-yellow-500 shrink-0">
                     <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                     <h4 className="font-bold mb-1">Instant Security</h4>
                     <p className="text-sm text-zinc-500 leading-relaxed">Your assets are protected by industry-standard encryption and real-time monitoring.</p>
                  </div>
               </div>
               
               <div className="flex gap-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-yellow-500 shrink-0">
                     <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                     <h4 className="font-bold mb-1">High Multipliers</h4>
                     <p className="text-sm text-zinc-500 leading-relaxed">Experience a unique mining system with up to 10x multipliers in our premium pools.</p>
                  </div>
               </div>
            </div>

            <div className="pt-8">
               <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <div className="relative flex items-center justify-between">
                     <div>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Current Hashrate</p>
                        <p className="text-2xl font-black font-mono">142.5 TH/s</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Active Users</p>
                        <p className="text-2xl font-black text-yellow-500 font-mono">8,421</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl"
        >
          <div className="lg:hidden text-center mb-10">
            <Pickaxe className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black tracking-tighter uppercase italic">Best Mining Hub</h2>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2 tracking-tight">
              {isLogin ? "Welcome Back" : "Enlist as Miner"}
            </h2>
            <p className="text-sm text-zinc-500">
              {isLogin ? "Please enter your credentials to access the mine" : "Fill the details below to join the most elite mining pool"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold animate-pulse">
              SYSTEM ERROR: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Secure Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30 transition-all font-medium"
                  placeholder="miner@id.host"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Access Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-yellow-500/10 text-sm uppercase"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                <>
                  <LogIn className="w-5 h-5" />
                  Initialize Terminal
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Register Miner
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-zinc-600 hover:text-yellow-500 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              {isLogin ? "REQUEST ACCESS KEY" : "ALREADY ENLISTED? SIGN IN"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
