"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPages, createPage, createSubPage, getChildPages, getUser, getToken, clearAuth } from "../../lib/api";

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
    setUser(getUser());
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

  // Renders a page link + its children recursively
  function PageLink({ page, depth = 0 }) {
    const isExpanded = expandedPages[page.id];
    const children = childPages[page.id] || [];

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
              {user?.name ?? "My Space"}
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

          {/* Pages section label */}
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.28)", letterSpacing: "0.04em", textTransform: "uppercase", padding: "14px 10px 4px 10px" }}>
            Pages
          </div>

          {/* Page tree */}
          {loadingPages ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", padding: "8px 10px" }}>Loading...</div>
          ) : pages.length === 0 ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", padding: "8px 10px" }}>No pages yet</div>
          ) : (
            pages.map(page => <PageLink key={page.id} page={page} />)
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
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 24 }}>
                Created {new Date(selectedPage.created_at).toLocaleDateString()}
              </p>
              <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.8, whiteSpace: "pre-wrap", marginBottom: 40 }}>
                {selectedPage.content || <em style={{ color: "rgba(255,255,255,0.25)" }}>No content yet.</em>}
              </p>

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
                  <textarea
                    placeholder="Content (optional)"
                    value={subPageContent}
                    onChange={e => setSubPageContent(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", minHeight: 70, background: "#0c0f13", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#fff", fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
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
                  <textarea
                    placeholder="Write something..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", minHeight: 80, background: "#0c0f13", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#fff", fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
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
        <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 16 }}>
          Welcome to your workspace{user?.name ? `, ${user.name}` : ""}. Your AI assistant is coming soon — it will help you summarize notes, generate meeting notes, and improve your writing.
        </p>
        <div style={{ background: "#1f1f1f", padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
          Track and organize any kind of work
        </div>
        <div style={{ marginTop: "auto", background: "#4d4b4b", padding: 10, borderRadius: 6, fontSize: 13, color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="bi bi-search"></i>
          Ask me anything...
        </div>
      </div>

    </div>
  );
}