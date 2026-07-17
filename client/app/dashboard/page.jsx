"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPages, createPage, createSubPage, getChildPages, updatePage, sharePage, askAI, getUser, getToken, clearAuth } from "../../lib/api";
import RichTextEditor from "../../components/RichTextEditor";

export default function DashboardPage() {
  const [pages, setPages] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadingPages, setLoadingPages] = useState(true);
  const [error, setError] = useState("");
  const [selectedPage, setSelectedPage] = useState(null);
  const [user, setUser] = useState(null);
  const [expandedPages, setExpandedPages] = useState({});
  const [childPages, setChildPages] = useState({});
  const [subPageTitle, setSubPageTitle] = useState("");
  const [subPageContent, setSubPageContent] = useState("");
  const [creatingSubPage, setCreatingSubPage] = useState(false);
  const router = useRouter();
  const [saveStatus, setSaveStatus] = useState(""); // "Saving...", "Saved", or ""
  const [saveTimer, setSaveTimer] = useState(null);  // holds the debounce timer
  const [shareUrl, setShareUrl] = useState("");
  const [sharing, setSharing] = useState(false); 
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      window.history.replaceState({}, "", "/dashboard");
    }
    if (!getToken()) {
      router.replace("/login");
      return;
    }
     // Decode user info from JWT token directly
      const token = getToken();
      if (token) {
       try {
        const payload = JSON.parse(atob(token.split(".")[1]));
         setUser({ 
          id: payload.user_id, 
          role: payload.role, 
         team_id: payload.team_id 
         });
    } catch (e) {
    console.error("Failed to decode token", e);
  }
}
    fetchPages();
  }, []);

  async function fetchPages() {
    setLoadingPages(true);
    try {
      const data = await getPages();
      // only top-level pages (no parent)
      setPages(data.filter(p => !p.parent_id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPages(false);
    }
  }

  async function toggleExpand(page) {
    const id = page.id;
    if (expandedPages[id]) {
      // collapse
      setExpandedPages(prev => ({ ...prev, [id]: false }));
    } else {
      // expand — fetch children if not already loaded
      if (!childPages[id]) {
        try {
          const children = await getChildPages(id);
          setChildPages(prev => ({ ...prev, [id]: children }));
        } catch (err) {
          setError(err.message);
        }
      }
      setExpandedPages(prev => ({ ...prev, [id]: true }));
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    setCreating(true);
    setError("");
    try {
      const newPage = await createPage(title, content);
      setPages(prev => [newPage, ...prev]);
      setTitle("");
      setContent("");
      setSelectedPage(newPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateSubPage(e) {
    e.preventDefault();
    if (!subPageTitle.trim()) { setError("Title is required."); return; }
    setCreatingSubPage(true);
    setError("");
    try {
      const newSubPage = await createSubPage(subPageTitle, subPageContent, selectedPage.id);
      // add to children list
      setChildPages(prev => ({
        ...prev,
        [selectedPage.id]: [newSubPage, ...(prev[selectedPage.id] || [])]
      }));
      // expand parent
      setExpandedPages(prev => ({ ...prev, [selectedPage.id]: true }));
      setSubPageTitle("");
      setSubPageContent("");
      setSelectedPage(newSubPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingSubPage(false);
    }
  }

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }
async function handleShare() {
  setSharing(true);
  setShareUrl("");
  try {
    const data = await sharePage(selectedPage.id);
    setShareUrl(data.share_url);
  } catch (err) {
    setError(err.message);
  } finally {
    setSharing(false);
  }
}

async function handleAskAI(e) {
  e.preventDefault();
  if (!aiPrompt.trim()) return;
  setAiLoading(true);
  setAiResponse("");
  try {
    const data = await askAI(
      aiPrompt,
      selectedPage?.title || "",
      selectedPage?.content || ""
    );
    setAiResponse(data.response);
  } catch (err) {
    setAiResponse("Error: " + err.message);
  } finally {
    setAiLoading(false);
    setAiPrompt("");
  }
}

  function handleContentChange(newContent) {
  // Update content state immediately so editor shows changes
  setSelectedPage(prev => ({ ...prev, content: newContent }));

  // Clear any existing timer (reset the 1 second countdown)
  if (saveTimer) clearTimeout(saveTimer);

  // Show "Saving..." status
  setSaveStatus("Saving...");

  // Start a new 1 second timer — only saves after user stops typing
  const timer = setTimeout(async () => {
    try {
      await updatePage(selectedPage.id, selectedPage.title, newContent);
      setSaveStatus("Saved ✓");
      // Clear the "Saved" message after 2 seconds
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      setSaveStatus("Failed to save");
    }
  }, 1000);

  setSaveTimer(timer);
}

  // Renders a page link + its children recursively
  function PageLink({ page, depth = 0 }) {
    const isExpanded = expandedPages[page.id];
    const children = childPages[page.id] || [];

    if (!getToken()) return null;

    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            paddingLeft: 10 + depth * 16,
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13.5,
            color: selectedPage?.id === page.id ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.72)",
            background: selectedPage?.id === page.id ? "rgba(255,255,255,0.09)" : "transparent",
            minHeight: 32,
            transition: "background 0.12s ease",
          }}
          onMouseEnter={e => e.currentTarget.style.background = selectedPage?.id === page.id ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.07)"}
          onMouseLeave={e => e.currentTarget.style.background = selectedPage?.id === page.id ? "rgba(255,255,255,0.09)" : "transparent"}
        >
          {/* expand/collapse arrow */}
          <span
            onClick={(e) => { e.stopPropagation(); toggleExpand(page); }}
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 11,
              width: 16,
              flexShrink: 0,
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.18s ease",
              display: "inline-block",
            }}
          >
            ▶
          </span>
          {/* page title */}
          <span
            style={{ flex: 1, fontWeight: 450 }}
            onClick={() => setSelectedPage(page)}
          >
            📄 {page.title}
          </span>
        </div>

        {/* children */}
        {isExpanded && children.length > 0 && (
          <div>
            {children.map(child => (
              <PageLink key={child.id} page={child} depth={depth + 1} />
            ))}
          </div>
        )}
        {isExpanded && children.length === 0 && (
          <div style={{ paddingLeft: 10 + (depth + 1) * 16, fontSize: 12, color: "rgba(255,255,255,0.25)", padding: "4px 10px 4px " + (10 + (depth + 1) * 16) + "px" }}>
            No subpages
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#000", color: "#f0f4ff", fontFamily: "system-ui, sans-serif" }}>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ width: 240, minWidth: 240, background: "#191919", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column" }}>

        {/* Workspace topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 10px 10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", minHeight: 44 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "#e8a020", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase() ?? "D"}
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.88)", flex: 1 }}>
              {user?.email ?? "My Space"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {["bi bi-search", "bi bi-plus-lg"].map((icon, i) => (
              <button key={i} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}
                onClick={i === 1 ? () => setSelectedPage(null) : undefined}>
                <i className={icon}></i>
              </button>
            ))}
          </div>
        </div>

        {/* Nav items */}
        <div style={{ padding: "8px 6px 4px 6px", flex: 1, overflowY: "auto" }}>
          {[
            { icon: "bi bi-house", label: "Home" },
            { icon: "bi bi-search", label: "Search", shortcut: "⌘K" },
            { icon: "bi bi-inbox", label: "Inbox" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13.5, color: "rgba(255,255,255,0.72)", minHeight: 32 }}>
              <i className={item.icon} style={{ fontSize: 14, width: 18, textAlign: "center" }}></i>
              <span style={{ flex: 1, fontWeight: 450 }}>{item.label}</span>
              {item.shortcut && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{item.shortcut}</span>}
            </div>
          ))}

        {/* Workspace pages */}
{!!(user?.team_id) && (
  <>
    <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.28)", letterSpacing: "0.04em", textTransform: "uppercase", padding: "14px 10px 4px 10px" }}>
      Workspace
    </div>
    {loadingPages ? (
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", padding: "8px 10px" }}>Loading...</div>
    ) : pages.filter(p => p.team_id).length === 0 ? (
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", padding: "8px 10px" }}>No workspace pages</div>
    ) : (
      pages.filter(p => p.team_id).map(page => <PageLink key={page.id} page={page} />)
    )}
  </>
)}

{/* Personal pages */}
<div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.28)", letterSpacing: "0.04em", textTransform: "uppercase", padding: "14px 10px 4px 10px" }}>
  Personal
</div>
{loadingPages ? (
  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", padding: "8px 10px" }}>Loading...</div>
) : pages.filter(p => !p.team_id).length === 0 ? (
  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", padding: "8px 10px" }}>No personal pages</div>
) : (
  pages.filter(p => !p.team_id).map(page => <PageLink key={page.id} page={page} />)
)}
        </div>

        {/* Sidebar bottom */}
        <div style={{ padding: "4px 6px 12px 6px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { icon: "bi bi-trash3", label: "Trash" },
            { icon: "bi bi-gear", label: "Settings" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13.5, color: "rgba(255,255,255,0.72)", minHeight: 32 }}>
              <i className={item.icon} style={{ fontSize: 14, width: 18, textAlign: "center" }}></i>
              <span style={{ flex: 1, fontWeight: 450 }}>{item.label}</span>
            </div>
          ))}
          <div onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13.5, color: "rgba(255,100,100,0.7)", minHeight: 32 }}>
            <i className="bi bi-box-arrow-left" style={{ fontSize: 14, width: 18, textAlign: "center" }}></i>
            <span style={{ flex: 1, fontWeight: 450 }}>Log out</span>
          </div>
        </div>
      </div>

      {/* ── CENTRE ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>

        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0 }}>
            {selectedPage ? selectedPage.title : "Notes"}
          </h1>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ background: "none", border: "none", color: "#f0f4ff", cursor: "pointer", fontSize: 16 }}>
              <i className="bi bi-search"></i>
            </button>
            <button
              onClick={() => setSelectedPage(null)}
              style={{ background: "#38940a", border: "none", color: "white", padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
              New note ＋
            </button>
          </div>
        </div>

        {error && <p style={{ color: "#ff6b6b", padding: "8px 24px", margin: 0, fontSize: 13 }}>{error}</p>}

        <div style={{ padding: "24px" }}>

          {selectedPage ? (
            /* ── OPEN PAGE VIEW ── */
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "rgba(255,255,255,0.93)" }}>{selectedPage.title}</h2>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>
    Created {new Date(selectedPage.created_at).toLocaleDateString()}
  </p>
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    {saveStatus && (
      <span style={{ fontSize: 12, color: saveStatus === "Saved ✓" ? "#89ba5c" : "rgba(255,255,255,0.4)" }}>
        {saveStatus}
      </span>
    )}
    <button
      onClick={handleShare}
      disabled={sharing}
      style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#38940a", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
      {sharing ? "Generating..." : "🔗 Share"}
    </button>
  </div>
</div>

{/* Share URL display */}
{shareUrl && (
  <div style={{ background: "#191919", border: "1px solid rgba(56,148,10,0.4)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
    <span style={{ fontSize: 12, color: "#89ba5c", flex: 1, wordBreak: "break-all" }}>{shareUrl}</span>
    <button
      onClick={() => { navigator.clipboard.writeText(shareUrl); }}
      style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "none", color: "#fff", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
      Copy
    </button>
  </div>
)}

                <RichTextEditor
                 content={selectedPage.content || ""}
                  editable={true}
                 onChange={handleContentChange}
                 />

              {/* Create subpage section */}
              <div style={{ background: "#191919", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 20, marginTop: 32 }}>
                <h3 style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 16, fontWeight: 500 }}>＋ New subpage</h3>
                <form onSubmit={handleCreateSubPage}>
                  <input
                    type="text"
                    placeholder="Subpage title"
                    value={subPageTitle}
                    onChange={e => setSubPageTitle(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", marginBottom: 10, background: "#0c0f13", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  />
 
                  <RichTextEditor
                  content={subPageContent}
                   onChange={setSubPageContent}
                  />

                  <button
                    type="submit"
                    disabled={creatingSubPage}
                    style={{ marginTop: 10, padding: "9px 18px", borderRadius: 7, border: "none", background: "#38940a", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                    {creatingSubPage ? "Creating..." : "Create subpage"}
                  </button>
                </form>
              </div>

              {/* Show existing subpages */}
              {childPages[selectedPage.id]?.length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <h3 style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Subpages</h3>
                  {childPages[selectedPage.id].map(child => (
                    <div
                      key={child.id}
                      onClick={() => setSelectedPage(child)}
                      style={{ background: "#89ba5c", padding: 14, borderRadius: 8, marginBottom: 12, cursor: "pointer", boxShadow: "15px 15px 30px rgb(25,25,25), -15px -15px 30px rgb(60,60,60)" }}>
                      <h3 style={{ fontSize: 14, margin: "0 0 4px 0", color: "#fff" }}>{child.title}</h3>
                      <span style={{ fontSize: 12, color: "#e0d7d7" }}>{new Date(child.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          ) : (
            /* ── NOTES LIST VIEW ── */
            <>
              {/* Create page form */}
              <div style={{ background: "#191919", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 20, marginBottom: 28 }}>
                <h3 style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 16, fontWeight: 500 }}>New note</h3>
                <form onSubmit={handleCreate}>
                  <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", marginBottom: 10, background: "#0c0f13", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  />
                 <RichTextEditor
                  content={content}
                  onChange={setContent}
                 />
                  <button
                    type="submit"
                    disabled={creating}
                    style={{ marginTop: 10, padding: "9px 18px", borderRadius: 7, border: "none", background: "#38940a", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                    {creating ? "Creating..." : "Create note"}
                  </button>
                </form>
              </div>

              {/* Notes list */}
              <div>
                {loadingPages ? (
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading...</p>
                ) : pages.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No notes yet. Create your first one above!</p>
                ) : (
                  pages.map(page => (
                    <div
                      key={page.id}
                      onClick={() => setSelectedPage(page)}
                      style={{ background: "#89ba5c", padding: 14, borderRadius: 8, marginBottom: 20, cursor: "pointer", boxShadow: "15px 15px 30px rgb(25,25,25), -15px -15px 30px rgb(60,60,60)" }}>
                      <h3 style={{ fontSize: 15, margin: "0 0 6px 0", color: "#fff" }}>{page.title}</h3>
                      <p style={{ fontSize: 13, color: "#e0d7d7", margin: "0 0 6px 0" }}>
                        {page.content ? page.content.slice(0, 80) + (page.content.length > 80 ? "..." : "") : "No content"}
                      </p>
                      <span style={{ fontSize: 12, color: "#e0d7d7" }}>{new Date(page.created_at).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

    {/* ── RIGHT SIDEBAR (AI Workspace) ── */}
<div style={{ width: "22%", minWidth: 200, background: "#1c1a1a", padding: 20, display: "flex", flexDirection: "column", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
  <h3 style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.88)", marginBottom: 12, letterSpacing: "0.04em", textTransform: "uppercase" }}>AI Workspace</h3>
  
  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 16 }}>
    {selectedPage 
      ? `Asking about: "${selectedPage.title}"` 
      : "Open a page to give AI context, or ask anything."}
  </p>

  {/* Quick action buttons */}
  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
    {[
      { label: "📝 Summarize this page", prompt: "Summarize this page in 3 bullet points." },
      { label: "📋 Generate meeting notes", prompt: "Convert this page content into structured meeting notes." },
      { label: "✍️ Improve writing", prompt: "Improve the writing quality of this page content." },
    ].map((action, i) => (
      <button
        key={i}
        onClick={() => setAiPrompt(action.prompt)}
        style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "#1f1f1f", color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer", textAlign: "left" }}>
        {action.label}
      </button>
    ))}
  </div>

  {/* AI response area */}
  {aiLoading && (
    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 12, padding: 10, background: "#1f1f1f", borderRadius: 6 }}>
      Thinking...
    </div>
  )}
  {aiResponse && !aiLoading && (
    <div style={{ flex: 1, overflowY: "auto", marginBottom: 12, padding: 12, background: "#1f1f1f", borderRadius: 8, fontSize: 12.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
      {aiResponse}
    </div>
  )}

  {/* Chat input */}
  <form onSubmit={handleAskAI} style={{ marginTop: "auto" }}>
    <textarea
      value={aiPrompt}
      onChange={e => setAiPrompt(e.target.value)}
      placeholder="Ask me anything..."
      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAskAI(e); }}}
      style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#4d4b4b", color: "#fff", fontSize: 12, resize: "none", minHeight: 60, boxSizing: "border-box", fontFamily: "inherit" }}
    />
    <button
      type="submit"
      disabled={aiLoading || !aiPrompt.trim()}
      style={{ width: "100%", marginTop: 8, padding: "8px", borderRadius: 6, border: "none", background: "#38940a", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
      {aiLoading ? "Thinking..." : "Ask AI ↵"}
    </button>
  </form>
</div>

    </div>
  );
}