"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPages, createPage, createSubPage, getChildPages, updatePage, sharePage, askAI, deletePage, getUser, getToken, clearAuth } from "../../lib/api";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatch, setSearchMatch] = useState("");
  const [aiHistory, setAiHistory] = useState([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const searchResults = searchQuery.trim() === "" ? [] : pages.filter(page =>
  page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  (page.content && page.content.toLowerCase().includes(searchQuery.toLowerCase()))
);
 
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

async function handleDeletePage(page) {
  if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
  try {
    await deletePage(page.id);
    setPages(prev => prev.filter(p => p.id !== page.id));
    setSelectedPage(null);
  } catch (err) {
    setError(err.message);
  }
}

async function handleEditTitle(e) {
  e.preventDefault();
  if (!newTitle.trim()) return;
  try {
    await updatePage(selectedPage.id, newTitle, selectedPage.content);
    setSelectedPage(prev => ({ ...prev, title: newTitle }));
    setPages(prev => prev.map(p => p.id === selectedPage.id ? { ...p, title: newTitle } : p));
    setEditingTitle(false);
  } catch (err) {
    setError(err.message);
  }
}

async function handleAskAI(e) {
  e.preventDefault();
  if (!aiPrompt.trim()) return;
  setAiLoading(true);
  try {
    const data = await askAI(
      aiPrompt,
      selectedPage?.title || "",
      selectedPage?.content || ""
    );
    // Add to history
    setAiHistory(prev => [...prev, 
      { role: "user", text: aiPrompt },
      { role: "ai", text: data.response }
    ]);
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
           <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}
            onClick={() => setSelectedPage(null)}>
            <i className="bi bi-plus-lg"></i>
            </button>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ padding: "8px 6px 4px 6px", flex: 1, overflowY: "auto" }}>
        {[
         { icon: "bi bi-house", label: "Home" },
         { icon: "bi bi-inbox", label: "Inbox" },
         ].map((item, i) => (
         <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13.5, color: "rgba(255,255,255,0.72)", minHeight: 32 }}>
         <i className={item.icon} style={{ fontSize: 14, width: 18, textAlign: "center" }}></i>
         <span style={{ flex: 1, fontWeight: 450 }}>{item.label}</span>
         </div> 
         ))}

         {/* Search item — separate for clickable */}
         <div
          onClick={() => { setSearchOpen(true); setSearchQuery(""); }}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13.5, color: "rgba(255,255,255,0.72)", minHeight: 32 }}>
          <i className="bi bi-search" style={{ fontSize: 14, width: 18, textAlign: "center" }}></i>
          <span style={{ flex: 1, fontWeight: 450 }}>Search</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>⌘K</span>
          </div>

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
  <button
    onClick={() => { setSearchOpen(true); setSearchQuery(""); }}
    style={{ background: "none", border: "none", color: "#f0f4ff", cursor: "pointer", fontSize: 16 }}>
    <i className="bi bi-search"></i>
  </button>
</div>
        </div>

        {error && <p style={{ color: "#ff6b6b", padding: "8px 24px", margin: 0, fontSize: 13 }}>{error}</p>}

        <div style={{ padding: "24px" }}>

          {selectedPage ? (
            /* ── OPEN PAGE VIEW ── */
            <div>
               {editingTitle ? (
  <form onSubmit={handleEditTitle} style={{ marginBottom: 8 }}>
    <input
      autoFocus
      value={newTitle}
      onChange={e => setNewTitle(e.target.value)}
      onBlur={() => setEditingTitle(false)}
      onKeyDown={e => e.key === "Escape" && setEditingTitle(false)}
      style={{ fontSize: 28, fontWeight: 700, background: "none", border: "none", borderBottom: "2px solid #38940a", outline: "none", color: "#fff", width: "100%", paddingBottom: 4 }}
    />
  </form>
) : (
  <h2
    onClick={() => { setEditingTitle(true); setNewTitle(selectedPage.title); }}
    title="Click to edit title"
    style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "rgba(255,255,255,0.93)", cursor: "text" }}>
    {selectedPage.title} <span style={{ fontSize: 14, color: "rgba(255,255,255,0.2)", fontWeight: 400 }}>✏️</span>
  </h2>
)}
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
<button
  onClick={() => handleDeletePage(selectedPage)}
  style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "rgba(255,80,80,0.15)", color: "#ff6b6b", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
  🗑 Delete
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
     {searchMatch && selectedPage?.content?.toLowerCase().includes(searchMatch.toLowerCase()) && (
  <div style={{ background: "#1a2a1a", border: "1px solid rgba(56,148,10,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#89ba5c" }}>
    🔍 Showing page with match for <strong>"{searchMatch}"</strong>
    <button onClick={() => setSearchMatch("")} style={{ marginLeft: 10, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 11 }}>✕ clear</button>
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
    { label: "📝 Summarize this page", prompt: "Summarize this page in 3 concise bullet points." },
    { label: "📋 Generate meeting notes", prompt: "Convert this page content into structured meeting notes with attendees, discussion points, and decisions." },
    { label: "✍️ Improve writing", prompt: "Improve the writing quality, clarity and flow of this page content. Show the improved version." },
    { label: "✅ Extract action items", prompt: "Extract all action items, tasks and todos from this page. Format them as a numbered checklist." },
    { label: "💡 Generate content", prompt: "Based on the page title and existing content, generate additional relevant content to expand this page." },
  ].map((action, i) => (
    <button
      key={i}
      onClick={() => setAiPrompt(action.prompt)}
      style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "#1f1f1f", color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer", textAlign: "left" }}>
      {action.label}
    </button>
  ))}
</div>

{/* Conversation history */}
{aiHistory.length > 0 && (
  <div style={{ flex: 1, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
    {aiHistory.map((msg, i) => (
      <div key={i} style={{
        padding: "8px 12px",
        borderRadius: 8,
        fontSize: 12,
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
        background: msg.role === "user" ? "rgba(56,148,10,0.15)" : "#1f1f1f",
        color: msg.role === "user" ? "#89ba5c" : "rgba(255,255,255,0.75)",
        alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
        maxWidth: "90%",
      }}>
        {msg.text}
      </div>
    ))}
    {aiLoading && (
      <div style={{ padding: "8px 12px", borderRadius: 8, fontSize: 12, background: "#1f1f1f", color: "rgba(255,255,255,0.4)", alignSelf: "flex-start" }}>
        Thinking...
      </div>
    )}
  </div>
)}

{/* Clear history button */}
{aiHistory.length > 0 && (
  <button
    onClick={() => { setAiHistory([]); setAiResponse(""); }}
    style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", marginBottom: 8, textAlign: "left" }}>
    ✕ Clear conversation
  </button>
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
     
{/* ── SEARCH MODAL ── */}
{searchOpen && (
  <div
    onClick={() => setSearchOpen(false)}
    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 120 }}>
    <div
      onClick={e => e.stopPropagation()}
      style={{ width: "100%", maxWidth: 560, background: "#1c1a1a", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", overflow: "hidden" }}>
      
      {/* Search input */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <i className="bi bi-search" style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}></i>
        <input
          autoFocus
          type="text"
          placeholder="Search pages..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === "Escape" && setSearchOpen(false)}
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 14 }}
        />
        <button
          onClick={() => setSearchOpen(false)}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12 }}>
          ESC
        </button>
      </div>

      {/* Search results */}
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {searchQuery.trim() === "" ? (
          <div style={{ padding: "20px 16px", fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
            Type to search your pages...
          </div>
        ) : searchResults.length === 0 ? (
          <div style={{ padding: "20px 16px", fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
            No pages found for "{searchQuery}"
          </div>
        ) : (
          searchResults.map(page => (
            <div
              key={page.id}
              onClick={() => { setSelectedPage(page); setSearchMatch(searchQuery); setSearchOpen(false); setSearchQuery(""); }}
              style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <i className="bi bi-file-text" style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}></i>
                <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{page.title}</span>
              </div>
              {page.content && (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "4px 0 0 22px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
               {(() => {
                 const plain = page.content.replace(/<[^>]*>/g, "");
                  const idx = plain.toLowerCase().indexOf(searchQuery.toLowerCase());
                   if (idx === -1) return plain.slice(0, 80);
                  const start = Math.max(0, idx - 30);
                   const excerpt = plain.slice(start, start + 100);
                   const matchStart = idx - start;
                    const matchEnd = matchStart + searchQuery.length;
                return (
                <>
             {excerpt.slice(0, matchStart)}
              <mark style={{ background: "#38940a", color: "#fff", borderRadius: 2, padding: "0 2px" }}>
               {excerpt.slice(matchStart, matchEnd)}
             </mark>
              {excerpt.slice(matchEnd)}
           </>
               );
             })()}
              </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}
    
    </div>
  );
}