import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, Deposit } from "../types";
import { Wallet, Image as ImageIcon, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface DepositSectionProps {
  user: UserProfile;
}

export default function DepositSection({ user }: DepositSectionProps) {
  const [amount, setAmount] = useState(300);
  const [proof, setProof] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 300) return;
    setLoading(true);

    try {
      const deposit: Omit<Deposit, "id"> = {
        userId: user.uid,
        email: user.email,
        amount,
        screenshotUrl: proof, // In a real app, this would be a file upload to Storage
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, "deposits"), deposit);
      setSuccess(true);
      setProof("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
        <h2 className="text-xl font-bold text-white mb-2">Deposit Submitted!</h2>
        <p className="text-zinc-400 mb-6 text-sm">
          Admin will verify your payment details shortly. Please wait for approval.
        </p>
        <button 
          onClick={() => setSuccess(false)}
          className="text-yellow-500 font-medium hover:underline"
        >
          Submit another deposit
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
        <h3 className="text-yellow-500 font-bold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Payment Instructions
        </h3>
        <p className="text-zinc-300 text-sm mb-4">
          Send at least <span className="text-white font-bold">300 PKR</span> to the following number via EasyPaisa or JazzCash:
        </p>
        <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 flex flex-col items-center justify-center shadow-inner">
          <span className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Account Number</span>
          <span className="text-2xl font-mono font-bold text-white tracking-wider">03173989676</span>
          <span className="text-zinc-400 text-xs mt-2 italic">Name will show as 'Ehtisham'</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Amount (PKR)</label>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="number"
              min="300"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            />
          </div>
          {amount < 300 && (
            <p className="text-red-500 text-xs mt-1">Minimum deposit is 300 PKR</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 ml-1">Proof (Transaction ID or Image Link)</label>
          <div className="relative">
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              required
              placeholder="Paste screenshot link or Transaction ID"
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || amount < 300}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent animate-spin rounded-full" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Payment Proof
            </>
          )}
        </button>
      </form>
    </div>
  );
}
