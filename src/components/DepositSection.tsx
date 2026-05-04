import React, { useState, useRef } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, Deposit } from "../types";
import { 
  CreditCard, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Info,
  Smartphone,
  Upload,
  Image as ImageIcon,
  X,
  Wallet
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DepositSectionProps {
  user: UserProfile;
}

export default function DepositSection({ user }: DepositSectionProps) {
  const [amount, setAmount] = useState(300);
  const [proof, setProof] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText("03173989676");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) { // 800KB limit for Firestore consistency
        alert("Image too large. Please select an image under 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setProof(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setProof("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proof.trim()) return;
    setLoading(true);

    try {
      const deposit: Omit<Deposit, "id"> = {
        userId: user.uid,
        email: user.email,
        amount,
        screenshotUrl: proof,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "deposits"), deposit);
      setSuccess(true);
      setProof("");
      setImagePreview(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center"
      >
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Proof Submitted!</h2>
        <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
          Admin will verify your payment and update your balance within 10-30 minutes.
        </p>
        <button 
          onClick={() => setSuccess(false)}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-xl font-bold transition-all"
        >
          Close
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Payment Guide */}
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-3xl p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
           <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-yellow-500" />
           </div>
           <div>
              <h3 className="text-white font-bold text-lg mb-1">Payment Instructions</h3>
              <p className="text-sm text-zinc-400">Send at least <span className="font-bold text-white">300 PKR</span> to the following account:</p>
           </div>
        </div>

        <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6 relative group overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Smartphone className="w-20 h-20 rotate-12" />
           </div>
           
           <div className="relative z-10 text-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Account Number</span>
              <div className="text-3xl font-black text-white mb-2 tracking-tighter">03173989676</div>
              <div className="text-xs text-zinc-400 font-medium italic mb-6">Name will show as 'Ehtisham'</div>
              
              <button 
                onClick={handleCopy}
                className={`flex items-center gap-2 mx-auto px-6 py-2 rounded-full font-bold transition-all active:scale-95 ${
                  copied ? "bg-green-500 text-black" : "bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/20"
                }`}
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "COPIED" : "COPY NUMBER"}
              </button>
           </div>
        </div>
      </div>

      {/* Submission Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Amount (PKR)</label>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="number"
                min="300"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-white focus:ring-2 focus:ring-yellow-500/50 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Proof of Payment</label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button
                 type="button"
                 onClick={() => fileInputRef.current?.click()}
                 className={`h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                   imagePreview 
                   ? "border-yellow-500/50 bg-yellow-500/5" 
                   : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                 }`}
               >
                 {imagePreview ? (
                   <div className="text-yellow-500 font-bold flex flex-col items-center">
                     <ImageIcon className="w-8 h-8 mb-1" />
                     <span className="text-[10px]">Image Selected</span>
                   </div>
                 ) : (
                   <div className="text-zinc-500 flex flex-col items-center">
                     <Upload className="w-8 h-8 mb-1" />
                     <span className="text-[10px]">Upload Screenshot</span>
                   </div>
                 )}
               </button>

               <div className="relative min-h-[8rem]">
                 <textarea
                   required
                   value={proof}
                   onChange={(e) => {
                     setProof(e.target.value);
                     if (!e.target.value.startsWith("data:image")) setImagePreview(null);
                   }}
                   placeholder="Or Paste Transaction ID..."
                   className="w-full h-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white resize-none text-sm focus:ring-2 focus:ring-yellow-500/50 outline-none"
                 />
                 {imagePreview && (
                    <div className="absolute inset-2 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden group">
                       <img src={imagePreview} className="w-full h-full object-contain" alt="Preview" />
                       <button 
                         type="button"
                         onClick={clearImage}
                         className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500 rounded-full text-white transition-colors"
                       >
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                 )}
               </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="flex items-center gap-3 bg-red-500/10 p-4 rounded-2xl border border-red-500/20 mb-4">
             <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
             <p className="text-[11px] text-zinc-400 leading-tight">
               Submitting fake or empty proof will lead to an <span className="text-red-500 font-bold">immediate account ban</span>. Only upload real screenshots.
             </p>
          </div>

          <button
            type="submit"
            disabled={loading || !proof.trim()}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-yellow-500/20"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-black border-t-transparent animate-spin rounded-full" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Payment Proof
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
