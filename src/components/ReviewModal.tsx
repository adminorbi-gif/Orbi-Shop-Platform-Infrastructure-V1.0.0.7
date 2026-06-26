import React, { useState } from "react";
import { X, Star } from "lucide-react";
import { db } from "../lib/db";
import { Customer, Review } from "../types";
import { useDialog } from "./CustomDialogContext";

interface ReviewModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
  lang: "sw" | "en";
  activeUser?: Customer | null;
  onSuccess: (review: Review) => void;
}

export default function ReviewModal({
  productId,
  productName,
  onClose,
  lang,
  activeUser,
  onSuccess,
}: ReviewModalProps) {
  const { showAlert } = useDialog();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      showAlert(
        lang === "sw"
          ? "Tafadhali jaza maoni yako kabla ya kutuma."
          : "Please input your comments before submitting.",
        "error"
      );
      return;
    }

    setSubmitting(true);
    try {
      const uName = activeUser ? activeUser.name : "Mteja";
      const savedReview = await db.saveReview({
        productId,
        customerName: uName,
        rating,
        comment,
      });
      showAlert(
        lang === "sw"
          ? "Asante sana! Uhakiki wako umetumwa na kuhifadhiwa kikamilifu."
          : "Thank you so much! Your review has been submitted and saved successfully.",
        "success"
      );
      onSuccess(savedReview);
      onClose();
    } catch (err: any) {
      console.error(err);
      showAlert(
        lang === "sw"
          ? "Imeshindikana kuhifadhi uhakiki, tafadhali jaribu tena."
          : "Failed to submit review, please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[250] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer animate-none"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-black text-slate-900 tracking-tight pr-8">
          {lang === "sw" ? "Uhakiki wa Bidhaa" : "Product Review"}
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1 mb-4 truncate" title={productName}>
          {productName}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest block font-sans">
              {lang === "sw" ? "Alama ya Nyota (Rating)" : "Star Rating"}
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 text-slate-200 hover:scale-110 transition cursor-pointer"
                >
                  <Star
                    size={28}
                    fill={star <= (hoverRating ?? rating) ? "#eab308" : "transparent"}
                    className={star <= (hoverRating ?? rating) ? "text-yellow-500" : "text-slate-350"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 font-sans">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest block">
              {lang === "sw" ? "Jina la Mteja" : "Customer Name"}
            </label>
            <input
              type="text"
              disabled
              value={activeUser ? activeUser.name : (lang === "sw" ? "Mteja (Guest)" : "Customer (Guest)")}
              className="w-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl p-3 outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="space-y-1.5 font-sans">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest block">
              {lang === "sw" ? "Maoni na Uzoefu Wako" : "Your Detailed Review"}
            </label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                lang === "sw"
                  ? "Andika maoni yako kuhusu ubora, utoaji au uzoefu wa duka..."
                  : "Write your review about the quality, delivery, or shopping experience..."
              }
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-xl p-3 focus:bg-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {lang === "sw" ? "Tuma Uhakiki" : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
