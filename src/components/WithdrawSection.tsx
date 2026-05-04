import React, { useState } from "react";
import { collection, addDoc, updateDoc, doc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, Withdrawal } from "../types";
import { 
  Banknote, 
  User, 
  CreditCard, 
  Send, 
  CheckCircle2, 
  Lock,
  ArrowRight
} from "lucide-react";
import { motion } from "motion/react";
import { handleFirestoreError, OperationType } from "../lib/utils";

interface WithdrawSectionProps {
  user: UserProfile;
}

export default function WithdrawSection({ user }: WithdrawSectionProps) {
  const [amount, setAmount] = useState(500);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [provider, setProvider] = useState("EasyPaisa");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Minimum 500 balance logic
  const canWithdraw = user.balance >= 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWithdraw || amount > user.balance || amount < 500) return;
    setLoading(true);

    try {
      const withdrawal: Omit<Withdrawal, "id"> = {
        userId: user.uid,
        email: user.email,
        amount,
        accountNumber,
        accountName,
        provider,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      // Atomic balance deduction
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(-amount)
      });
      
      await addDoc(collection(db, "withdrawals"), withdrawal);
      setSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "withdrawals");
    } finally {
      setLoading(false);
    }
  };

  if (!canWithdraw) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
        <div className="w-20 h-20 bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-800 shadow-2xl">
          <Lock className="w-10 h-10 text-zinc-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Withdrawal Locked</h2>
        <p className="text-zinc-400 max-w-sm mx-auto text-sm leading-relaxed mb-8">
          To unlock withdrawals, you must win at least <span className="text-yellow-500 font-bold">500 PKR</span>. 
          Keep mining and hit the jackpot!
        </p>
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden max-w-xs mx-auto">
           <div 
             className="h-full bg-yellow-500 transition-all duration-1000" 
             style={{ width: `${Math.min(100, (user.balance / 500) * 100)}%` }}
           />
        </div>
        <div className="mt-4 text-xs font-mono text-zinc-500 uppercase">
           {user.balance.toFixed(0)} / 500 PKR EARNED
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center"
      >
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Request Submitted!</h2>
        <p className="text-zinc-400 mb-6 text-sm">
          Admin will process your payment within 24 hours. Check your balance for updates.
        </p>
        <button 
          onClick={() => setSuccess(false)}
          className="text-yellow-500 font-medium hover:underline"
        >
          Make another request
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-yellow-500" />
          Request Cash Out
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Account Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-yellow-500/50 transition-all outline-none"
              >
                <option>EasyPaisa</option>
                <option>JazzCash</option>
                <option>SadaPay</option>
                <option>NayaPay</option>
                <option>Bank Account</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Amount to Withdraw</label>
              <div className="relative">
                 <input
                  type="number"
                  min="500"
                  max={user.balance}
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-yellow-500">PKR</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Account Number</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                <input
                  type="text"
                  required
                  placeholder="03XX-XXXXXXX"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Account Holder Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                <input
                  type="text"
                  required
                  placeholder="Exactly as in CNIC/App"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || amount > user.balance}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-yellow-500/20"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin rounded-full" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                CONFIRM WITHDRAWAL
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
