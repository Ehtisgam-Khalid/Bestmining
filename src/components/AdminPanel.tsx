import React, { useEffect, useState } from "react";
import { collection, query, onSnapshot, doc, updateDoc, increment, runTransaction } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, Deposit, Withdrawal } from "../types";
import { handleFirestoreError, OperationType } from "../lib/utils";
import { Check, X, Shield, Clock, Search, ExternalLink, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AdminPanel() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [activeTab, setActiveTab] = useState<"deposits" | "withdrawals">("deposits");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qD = query(collection(db, "deposits"));
    const unsubD = onSnapshot(qD, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Deposit[];
      setDeposits(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    });

    const qW = query(collection(db, "withdrawals"));
    const unsubW = onSnapshot(qW, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Withdrawal[];
      setWithdrawals(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });

    return () => { unsubD(); unsubW(); };
  }, []);

  const handleApproveDeposit = async (deposit: Deposit) => {
    if (!deposit.id) return;
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", deposit.userId);
        const depositRef = doc(db, "deposits", deposit.id!);
        
        transaction.update(userRef, {
          balance: increment(deposit.amount),
          totalDeposits: increment(deposit.amount)
        });
        transaction.update(depositRef, {
          status: "approved"
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "transaction:approve");
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    try {
      await updateDoc(doc(db, "withdrawals", withdrawalId), { status: "paid" });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `withdrawals/${withdrawalId}`);
    }
  };

  const handleReject = async (collectionName: "deposits" | "withdrawals", id: string) => {
    try {
      await updateDoc(doc(db, collectionName, id), { status: "rejected" });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-yellow-500" />
          Admin Control Center
        </h2>
        
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
           <button 
             onClick={() => setActiveTab("deposits")}
             className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'deposits' ? 'bg-zinc-800 text-yellow-500' : 'text-zinc-500'}`}
           >
             Deposits ({deposits.filter(d => d.status === 'pending').length})
           </button>
           <button 
             onClick={() => setActiveTab("withdrawals")}
             className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'withdrawals' ? 'bg-zinc-800 text-yellow-500' : 'text-zinc-500'}`}
           >
             Withdrawals ({withdrawals.filter(w => w.status === 'pending').length})
           </button>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Syncing database...</div>
        ) : activeTab === "deposits" ? (
          deposits.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 bg-zinc-900 rounded-2xl border border-dashed border-zinc-800">
              No deposit history.
            </div>
          ) : (
            deposits.map((deposit) => (
              <motion.div
                layout
                key={deposit.id}
                className={`bg-zinc-900 border ${
                  deposit.status === 'pending' ? 'border-yellow-500/30' : 'border-zinc-800'
                } rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <ArrowDownLeft className="w-3 h-3 text-green-500" />
                    <span className="font-bold text-white">{deposit.email}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(deposit.createdAt).toLocaleString()}
                    </span>
                    <span className="text-yellow-500 font-mono font-bold">
                      {deposit.amount} PKR
                    </span>
                  </div>
                  <p className="text-sm font-mono text-zinc-400 mt-2 bg-zinc-950 p-2 rounded border border-zinc-800 break-all">
                    Ref: {deposit.screenshotUrl}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  {deposit.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleReject("deposits", deposit.id!)}
                        className="flex-1 md:flex-none p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all"
                      >
                        <X className="w-5 h-5 mx-auto" />
                      </button>
                      <button
                        onClick={() => handleApproveDeposit(deposit)}
                        className="flex-1 md:flex-none px-6 py-3 bg-green-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-400 transition-all shadow-lg shadow-green-500/20"
                      >
                        <Check className="w-5 h-5" />
                        Approve
                      </button>
                    </>
                  ) : (
                    <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
                      deposit.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {deposit.status}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )
        ) : (
          withdrawals.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 bg-zinc-900 rounded-2xl border border-dashed border-zinc-800">
              No withdrawal requests.
            </div>
          ) : (
            withdrawals.map((withdrawal) => (
              <motion.div
                layout
                key={withdrawal.id}
                className={`bg-zinc-900 border ${
                  withdrawal.status === 'pending' ? 'border-blue-500/30' : 'border-zinc-800'
                } rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-3 h-3 text-blue-500" />
                    <span className="font-bold text-white">{withdrawal.email}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 md:gap-x-6">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold block">AMOUNT</span>
                      <span className="text-sm font-bold text-yellow-500">{withdrawal.amount} PKR</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold block">ACCOUNT</span>
                      <span className="text-sm font-mono text-zinc-300">{withdrawal.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold block">PROVIDER</span>
                      <span className="text-sm text-zinc-300">{withdrawal.provider} ({withdrawal.accountName})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  {withdrawal.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleReject("withdrawals", withdrawal.id!)}
                        className="flex-1 md:flex-none p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleApproveWithdrawal(withdrawal.id!)}
                        className="flex-1 md:flex-none px-6 py-3 bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-400 shadow-lg shadow-blue-500/20"
                      >
                        <Check className="w-5 h-5" />
                        Mark Paid
                      </button>
                    </>
                  ) : (
                    <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
                      withdrawal.status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {withdrawal.status}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )
        )}
      </div>
    </div>
  );
}
