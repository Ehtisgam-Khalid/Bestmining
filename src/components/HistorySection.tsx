import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, Deposit, Withdrawal } from "../types";
import { 
  History, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HistorySectionProps {
  user: UserProfile;
}

export default function HistorySection({ user }: HistorySectionProps) {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "deposits" | "withdrawals">("all");

  useEffect(() => {
    const qD = query(
      collection(db, "deposits"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const qW = query(
      collection(db, "withdrawals"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubD = onSnapshot(qD, (snap) => {
      setDeposits(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deposit)));
      setLoading(false);
    });

    const unsubW = onSnapshot(qW, (snap) => {
      setWithdrawals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal)));
    });

    return () => {
      unsubD();
      unsubW();
    };
  }, [user.uid]);

  const allTransactions = [
    ...deposits.map(d => ({ ...d, type: 'deposit' as const })),
    ...withdrawals.map(w => ({ ...w, type: 'withdrawal' as const }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredTransactions = allTransactions.filter(t => {
    if (filter === "all") return true;
    if (filter === "deposits") return t.type === "deposit";
    if (filter === "withdrawals") return t.type === "withdrawal";
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const statusStyles = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    approved: "bg-green-500/10 text-green-500 border-green-500/20",
    paid: "bg-green-500/10 text-green-500 border-green-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  if (loading) {
     return (
       <div className="flex items-center justify-center py-20">
         <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent animate-spin rounded-full" />
       </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
            <History className="text-yellow-500" />
            Transaction Activity
          </h2>
          <p className="text-sm text-zinc-500">View and track your mining financial history</p>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
           {(['all', 'deposits', 'withdrawals'] as const).map((t) => (
             <button
               key={t}
               onClick={() => setFilter(t)}
               className={`px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${
                 filter === t ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-white"
               }`}
             >
               {t}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
               <History className="w-8 h-8 text-zinc-700" />
            </div>
            <h3 className="text-white font-bold mb-1">No Activity Yet</h3>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto">
              Your deposits and withdrawals will appear here once you start mining.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
             {filteredTransactions.map((tx, i) => (
               <motion.div 
                 key={`${tx.id}-${i}`}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: i * 0.05 }}
                 className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-800/20 transition-colors"
               >
                 <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                     tx.type === 'deposit' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                   }`}>
                     {tx.type === 'deposit' ? <ArrowDownCircle className="w-6 h-6" /> : <ArrowUpCircle className="w-6 h-6" />}
                   </div>
                   
                   <div>
                     <div className="flex items-center gap-2 mb-0.5">
                       <span className="font-bold text-white tracking-tight">
                         {tx.type === 'deposit' ? 'Deposit Request' : 'Withdrawal Request'}
                       </span>
                       <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${statusStyles[tx.status as keyof typeof statusStyles]}`}>
                         {tx.status}
                       </span>
                     </div>
                     <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
                       <span className="flex items-center gap-1">
                         <Clock className="w-3 h-3" />
                         {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                       {tx.type === 'deposit' && (
                         <span className="flex items-center gap-1 group cursor-help text-zinc-600">
                           Ref: {tx.screenshotUrl.length > 20 ? 'Image Proof' : tx.screenshotUrl}
                         </span>
                       )}
                     </div>
                   </div>
                 </div>

                 <div className="flex items-center justify-between md:justify-end gap-6 border-t border-zinc-800/50 md:border-0 pt-4 md:pt-0">
                    <div className="text-right">
                       <div className={`text-lg font-black tracking-tighter ${tx.type === 'deposit' ? 'text-blue-500' : 'text-orange-500'}`}>
                         {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()} PKR
                       </div>
                       <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-none">Total Amount</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-700 hidden md:block" />
                 </div>
               </motion.div>
             ))}
          </div>
        )}
      </div>
      
      {/* Help Card */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
         <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
            <ExternalLink className="w-8 h-8 text-blue-500" />
         </div>
         <div className="text-center md:text-left flex-1">
            <h4 className="text-white font-bold text-lg mb-1">Need Status Update?</h4>
            <p className="text-sm text-zinc-400">Deposits and withdrawals usually take 10-30 minutes to verify. If your request is pending longer than 1 hour, contact our verified support channel.</p>
         </div>
         <button className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all whitespace-nowrap text-sm">
            Contact Support
         </button>
      </div>
    </div>
  );
}
