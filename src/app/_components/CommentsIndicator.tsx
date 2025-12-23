"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}

interface CommentsIndicatorProps {
  comments: Comment[];
}

export default function CommentsIndicator({ comments }: CommentsIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-200 transition-colors"
      >
        <MessageCircle size={16} />
        <span>{comments.length} Comment{comments.length !== 1 ? "s" : ""}</span>
      </button>

      {/* Comments Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 max-h-[70vh] overflow-hidden rounded-xl bg-white shadow-xl border border-zinc-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 bg-zinc-50">
              <h3 className="text-sm font-semibold text-zinc-900">
                Client Comments ({comments.length})
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
              >
                <X size={18} />
              </button>
            </div>

            {/* Comments List */}
            <div className="overflow-y-auto max-h-[calc(70vh-60px)] p-4 space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-lg bg-zinc-50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-zinc-900">
                      {comment.author}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
