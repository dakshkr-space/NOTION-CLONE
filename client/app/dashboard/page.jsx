"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPages, createPage, createSubPage, getChildPages, updatePage, sharePage, askAI, deletePage, getCurrentUser, logout, getPageSocketURL } from "../../lib/api";
import RichTextEditor from "../../components/RichTextEditor";
import VersionHistoryDrawer from "@/components/VersionHistoryDrawer";
import CommentsPanel from "@/components/CommentsPanel";
import SidebarPageList from "@/components/SidebarPageList";

// Small reusable icon-only button used in the page header action row
function IconButton({ icon, onClick, title, accent, danger }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 34, height: 34, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
      background: accent ? "#38940a" : danger ? "rgba(255,80,80,0.12)" : "transparent",
      color: danger ? "#ff6b6b" : "#fff", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
    }}>
      <i className={`bi ${icon}`}></i>
    </button>
  );
}

export default function DashboardPage() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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
  const [saveStatus, setSaveStatus] = useState(""); // "Saving...", "Saved ✓", or ""
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const searchResults = searchQuery.trim() === "" ? [] : pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (page.content && page.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );
 
  const TEMPLATES = [
    {
      icon: "📋",
      name: "Meeting Notes",
      title: "Meeting Notes — " + new Date().toLocaleDateString(),
      content: "<h2>Meeting Details</h2><p><strong>Date:</strong> " + new Date().toLocaleDateString() + "</p><p><strong>Attendees:</strong> </p><h2>Agenda</h2><ul><li><p>Item 1</p></li><li><p>Item 2</p></li></ul><h2>Discussion</h2><p></p><h2>Action Items</h2><ul><li><p> </p></li></ul><h2>Next Steps</h2><p></p>"
    },
    {
      icon: "🚀",
      name: "Project Doc",
      title: "Project — ",
      content: "<h1>Project Overview</h1><p></p><h2>Goals</h2><ul><li><p>Goal 1</p></li><li><p>Goal 2</p></li></ul><h2>Timeline</h2><p><strong>Start:</strong> </p><p><strong>End:</strong> </p><h2>Team</h2><p></p><h2>Tasks</h2><ul data-type=\"taskList\"><li data-type=\"taskItem\" data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>Task 1</p></div></li><li data-type=\"taskItem\" data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>Task 2</p></div></li></ul><h2>Notes</h2><p></p>"
    },
    {
      icon: "📚",
      name: "Study Notes",
      title: "Study Notes — ",
      content: "<h1>Topic</h1><h2>Key Concepts</h2><ul><li><p>Concept 1</p></li><li><p>Concept 2</p></li></ul><h2>Summary</h2><p></p><h2>Important Points</h2><ul><li><p>Point 1</p></li><li><p>Point 2</p></li></ul><h2>Questions</h2><ul><li><p>Question 1?</p></li></ul><h2>References</h2><p></p>"
    },
    {
      icon: "📝",
      name: "Daily Journal",
      title: "Journal — " + new Date().toLocaleDateString(),
      content: "<h2>Today's Goals</h2><ul data-type=\"taskList\"><li data-type=\"taskItem\" data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p></p></div></li></ul><h2>Notes</h2><p></p><h2>Wins</h2><p></p><h2>Tomorrow</h2><p></p>"
    },
    {
      icon: "🐛",
      name: "Bug Report",
      title: "Bug — ",
      content: "<h2>Description</h2><p></p><h2>Steps to Reproduce</h2><ul><li><p>Step 1</p></li><li><p>Step 2</p></li></ul><h2>Expected Behaviour</h2><p></p><h2>Actual Behaviour</h2><p></p><h2>Screenshots</h2><p></p><h2>Fix</h2><p></p>"
    },
  ];

  // STEP 8 — no more getToken()/atob() JWT decoding. The backend reads the
  // HttpOnly cookie itself and tells us who's logged in via /auth/me.
  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      setUser(currentUser);
      fetchPages();
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedPage?.id) return;

    let active = true;
    const socket = new WebSocket(getPageSocketURL(selectedPage.id));
    socket.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        if (!active) return;
        if (update.type === "page_snapshot" || update.type === "page_updated") {
          setSelectedPage(prev =>
            prev && prev.id === update.page_id
              ? { ...prev, title: update.title, content: update.content }
              : prev
          );
          setPages(prev => prev.map(p =>
            p.id === update.page_id ? { ...p, title: update.title, content: update.content } : p
          ));
        }
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      active = false;
      socket.close();
    };
  }, [selectedPage?.id]);


  async function fetchPages() {
    setLoadingPages(true);
    try {
    const data = await getPages();
   setPages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPages(false);
    }
  }

  async function toggleExpand(page) {
    const id = page.id;
    if (expandedPages[id]) {
      setExpandedPages(prev => ({ ...prev, [id]: false }));
    } else {
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

  function selectPage(page) {
    if (saveTimer) clearTimeout(saveTimer);
    setSaveStatus("");
    setSelectedPage(page);
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
      selectPage(newPage);
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
      setChildPages(prev => ({
        ...prev,
        [selectedPage.id]: [newSubPage, ...(prev[selectedPage.id] || [])]
      }));
      setExpandedPages(prev => ({ ...prev, [selectedPage.id]: true }));
      setSubPageTitle("");
      setSubPageContent("");
      selectPage(newSubPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingSubPage(false);
    }
  }

  // STEP 8 — now calls the backend's logout endpoint, which expires the
  // HttpOnly cookie server-side, instead of clearing localStorage.
  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

const [shareRole, setShareRole] = useState("viewer");

async function handleShare(role) {
  setSharing(true);
  setShareUrl("");
  try {
    const data = await sharePage(selectedPage.id, role);
    setShareUrl(data.share_url);
    setShareRole(data.share_role);
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
      selectPage(null);
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
    // Prevent triggering auto-save on missing or temporary pages
    if (!selectedPage || !selectedPage.id) return;

    const targetPageId = selectedPage.id;
    const targetPageTitle = selectedPage.title;

    // Update local state immediately
    setSelectedPage(prev => (prev ? { ...prev, content: newContent } : null));

    // Clear active timer
    if (saveTimer) clearTimeout(saveTimer);
    setSaveStatus("Saving...");

    // Debounce API update call
    const timer = setTimeout(async () => {
      try {
        await updatePage(targetPageId, targetPageTitle, newContent);
        setSaveStatus("Saved ✓");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch (err) {
        console.error("Auto-save error:", err);
        setSaveStatus("Failed to save");
      }
    }, 800);

    setSaveTimer(timer);
  }

  // NOTE: PageLink appears to be superseded by SidebarPageList (see earlier
  // review) — kept as-is structurally, just updated so it no longer
  // references the removed getToken() import. It now checks `user` instead,
  // which is equivalent (both were just "is someone logged in").
  function PageLink({ page, depth = 0 }) {
    const isExpanded = expandedPages[page.id];
    const children = childPages[page.id] || [];

    if (!user) return null;

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
          <span
            style={{ flex: 1, fontWeight: 450 }}
            onClick={() => selectPage(page)}
          >
            📄 {page.title}
          </span>
        </div>

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
            <button 
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}
              onClick={() => selectPage(null)}
            >
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

          {/* Search item */}
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
                <SidebarPageList 
                  pages={pages.filter(p => p.team_id && !p.parent_id)} 
                  allPages={pages}
                  setPages={setPages} 
                  selectPage={selectPage} 
                  selectedPage={selectedPage} 
                />
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
            <SidebarPageList 
              pages={pages.filter(p => !p.team_id && !p.parent_id)} 
              allPages={pages}
              setPages={setPages} 
              selectPage={selectPage} 
              selectedPage={selectedPage} 
            />
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
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {saveStatus && (
                    <span style={{ fontSize: 12, color: saveStatus === "Saved ✓" ? "#89ba5c" : "rgba(255,255,255,0.4)" }}>
                      {saveStatus}
                    </span>
                  )}

                  <IconButton
                    icon="bi-clock-history"
                    title="History"
                    onClick={() => { setShowVersions(!showVersions); setShowComments(false); }}
                  />
                  <IconButton
                    icon="bi-chat-left-text"
                    title="Comments"
                    onClick={() => { setShowComments(!showComments); setShowVersions(false); }}
                  />

                  <button
                    onClick={() => handleShare("viewer")}
                    disabled={sharing}
                    style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "none", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                    {sharing ? "..." : "👁 View link"}
                  </button>

                  <button
                    onClick={() => handleShare("editor")}
                    disabled={sharing}
                    style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#38940a", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                    {sharing ? "..." : "✏️ Edit link"}
                  </button>

                  <IconButton
                    icon="bi-trash3"
                    title="Delete"
                    danger
                    onClick={() => handleDeletePage(selectedPage)}
                  />
                </div>
              </div>

              {/* Share URL display */}
                {shareUrl && (
               <div style={{ background: "#191919", border: "1px solid rgba(56,148,10,0.4)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
               <span style={{ fontSize: 12, color: "#89ba5c", flex: 1, wordBreak: "break-all" }}>
                {shareRole === "editor" ? "🖊 Anyone with this link can edit: " : "👁 Anyone with this link can view: "}
                {shareUrl}
               </span>
               <button onClick={() => navigator.clipboard.writeText(shareUrl)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "none", color: "#fff", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
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
                      onClick={() => selectPage(child)}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 500, margin: 0 }}>New note</h3>
                  <button
                    onClick={() => setShowTemplates(true)}
                    style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#1f1f1f", color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer" }}>
                    📄 Use Template
                  </button>
                </div>
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
                      onClick={() => selectPage(page)}
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

      {/* ── TEMPLATES MODAL ── */}
      {showTemplates && (
        <div
          onClick={() => setShowTemplates(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 520, background: "#1c1a1a", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: "#fff" }}>Choose a template</h3>
              <button onClick={() => setShowTemplates(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {TEMPLATES.map((template, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setTitle(template.title);
                    setContent(template.content);
                    setShowTemplates(false);
                  }}
                  style={{ padding: "14px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "#111418", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#38940a"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{template.icon}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#eee", marginBottom: 4 }}>{template.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Pre-filled template</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                    onClick={() => { selectPage(page); setSearchMatch(searchQuery); setSearchOpen(false); setSearchQuery(""); }}
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

      {/* ── VERSION HISTORY & COMMENTS DRAWERS ── */}
      <VersionHistoryDrawer
        pageId={selectedPage?.id}
        isOpen={showVersions}
        onClose={() => setShowVersions(false)}
        onRestored={(updatedPage) => {
          selectPage(updatedPage);
          setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
        }}
      />

      <CommentsPanel
        pageId={selectedPage?.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />

    </div>
  );
}