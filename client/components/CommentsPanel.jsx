"use client";
import { useState, useEffect } from "react";
import { getComments, addComment } from "../lib/api";

export default function CommentsPanel({ pageId, isOpen, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments whenever the panel opens or the pageId changes
  useEffect(() => {
    if (isOpen && pageId) {
      loadComments();
    }
  }, [isOpen, pageId]);

  async function loadComments() {
    setLoading(true);
    try {
      const data = await getComments(pageId);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const savedComment = await addComment(pageId, newComment);
      setComments(prev => [...prev, savedComment]);
      setNewComment("");
    } catch (err) {
      alert("Failed to save comment: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: 320,
      height: "100vh",
      background: "#1c1a1a",
      borderLeft: "1px solid rgba(255,255,255,0.08)",
      zIndex: 90,
      display: "flex",
      flexDirection: "column",
      padding: 20,
      boxSizing: "border-box"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 15, color: "#fff" }}>💬 Comments</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16 }}>✕</button>
      </div>

      {/* Comments List */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading comments...</p>
        ) : comments.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No comments yet.</p>
        ) : (
          comments.map((comment, index) => (
            <div key={comment.id || index} style={{ background: "#262424", padding: 12, borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 11, color: "#38940a", fontWeight: 600, marginBottom: 4 }}>
                {comment.user?.name || comment.user?.email || "User"}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#e0e0e0", whiteSpace: "pre-wrap" }}>
                {comment.content}
              </p>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>
                {comment.created_at ? new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Comment Input */}
      <form onSubmit={handleSubmit}>
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#111418", color: "#fff", fontSize: 13, resize: "none", boxSizing: "border-box" }}
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          style={{ width: "100%", marginTop: 8, padding: "8px", borderRadius: 6, border: "none", background: "#38940a", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {submitting ? "Posting..." : "Post Comment"}
        </button>
      </form>
    </div>
  );
}