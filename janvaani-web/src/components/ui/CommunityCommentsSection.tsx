"use client";

import React, { useState } from "react";
import { MessageSquare, Send, User, ShieldCheck, Heart, Sparkles, AlertCircle } from "lucide-react";

export interface CommentItem {
  comment_id: string;
  author_name: string;
  text: string;
  created_at: string;
  role?: string;
  likes?: number;
}

interface CommunityCommentsSectionProps {
  incidentId: string;
  initialComments?: CommentItem[];
  onCommentAdded?: (newCount: number) => void;
}

export function CommunityCommentsSection({
  incidentId,
  initialComments = [],
  onCommentAdded,
}: CommunityCommentsSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [authorName, setAuthorName] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    const tempId = `temp-${Date.now()}`;
    const author = authorName.trim() || "Concerned Citizen";
    const optimisticComment: CommentItem = {
      comment_id: tempId,
      author_name: author,
      text: newCommentText.trim(),
      created_at: new Date().toISOString(),
      role: "Local Resident",
      likes: 1,
    };

    // Optimistic update
    const updated = [optimisticComment, ...comments];
    setComments(updated);
    setNewCommentText("");

    try {
      const res = await fetch(`/api/incidents/${incidentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: optimisticComment.text,
          author_name: author,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to post comment");
      }

      const data = await res.json();
      if (data.comment) {
        setComments((prev) =>
          prev.map((c) => (c.comment_id === tempId ? { ...c, comment_id: data.comment.comment_id } : c))
        );
        if (onCommentAdded && data.total_comments) {
          onCommentAdded(data.total_comments);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to sync comment with civic network. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = (id: string) => {
    setLikedComments((prev) => ({ ...prev, [id]: !prev[id] }));
    setComments((prev) =>
      prev.map((c) => {
        if (c.comment_id === id) {
          const currentLikes = c.likes || 1;
          return {
            ...c,
            likes: likedComments[id] ? currentLikes - 1 : currentLikes + 1,
          };
        }
        return c;
      })
    );
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <MessageSquare className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Citizen Discussion & Field Notes
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 text-xs font-semibold">
                {comments.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">Public updates, eyewitness notices, and worker dispatch notes</p>
          </div>
        </div>

        <span className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
          <ShieldCheck className="w-3.5 h-3.5" />
          Public Civic Log
        </span>
      </div>

      {/* New Comment Submission Form */}
      <form onSubmit={handlePostComment} className="mb-6 space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Your Name / Handle</label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma / Ward Resident"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/70 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex items-end text-xs text-slate-400 pb-1">
            <span>Identity is optional for public civic reports.</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Add Community Note or Update</label>
          <textarea
            rows={2}
            required
            placeholder="Share current status, obstruction info, or resolution observations..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/70 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
          />
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errorMsg}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-slate-500">Every comment is permanently timestamped.</p>
          <button
            type="submit"
            disabled={submitting || !newCommentText.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/40">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-400" />
            <p className="text-xs">No community notes yet. Be the first to share an observation!</p>
          </div>
        ) : (
          comments.map((cmt) => (
            <div
              key={cmt.comment_id}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-slate-700 transition-all flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">{cmt.author_name}</span>
                      {cmt.author_name.toLowerCase().includes("inspector") || cmt.author_name.toLowerCase().includes("team") ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                          Official Team
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 font-medium">
                          Citizen
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">{formatRelativeTime(cmt.created_at)}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleLike(cmt.comment_id)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    likedComments[cmt.comment_id]
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${likedComments[cmt.comment_id] ? "fill-current text-rose-400" : ""}`} />
                  <span>{cmt.likes || 1}</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pl-9">{cmt.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
