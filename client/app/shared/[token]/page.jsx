"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getSharedPage, getSharedPageSocketURL } from "../../../lib/api";
import RichTextEditor from "../../../components/RichTextEditor";

export default function SharedPage() {
  const params = useParams();
  const [page, setPage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  useEffect(() => {
    async function fetchPage() {
      try {
        const data = await getSharedPage(params.token);
        setPage(data);
      } catch (err) {
        setError("This page doesn't exist or the link has expired.");
      } finally {
        setLoading(false);
      }
    }
    fetchPage();
  }, []);

  useEffect(() => {
    if (!params.token) return;

    let active = true;
    const socket = new WebSocket(getSharedPageSocketURL(params.token));
    socket.onopen = () => active && setLive(true);
    socket.onclose = () => active && setLive(false);
    socket.onerror = () => active && setLive(false);
    socket.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        if (update.type === "page_snapshot" || update.type === "page_updated") {
          setPage((current) => ({ ...current, title: update.title, content: update.content, updated_at: update.updated_at }));
        }
      } catch {
        // Keep showing the most recently received valid page state.
      }
    };

    return () => {
      active = false;
      socket.close();
    };
  }, [params.token]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
      Loading...
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#ff6b6b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
      {error}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      
      {/* Header bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "14px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "#e8a020", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            N
          </div>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Notion Clone — Shared Page</span>
        </div>
        <a href="/login" style={{ fontSize: 13, color: "#89ba5c", textDecoration: "none" }}>
          Sign in to edit →
        </a>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: "rgba(255,255,255,0.93)" }}>
          {page.title}
        </h1>
        <p style={{ fontSize: 12, color: live ? "#89ba5c" : "rgba(255,255,255,0.3)", marginBottom: 32 }}>
          {live ? "Live updates connected" : "Shared page — read only"}
        </p>
        <RichTextEditor
          content={page.content || ""}
          editable={false}
        />
      </div>
    </div>
  );
}
