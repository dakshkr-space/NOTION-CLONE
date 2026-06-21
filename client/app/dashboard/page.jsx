"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPages, createPage, getUser, getToken, clearAuth } from "../../lib/api";

export default function DashboardPage() {
  const [pages, setPages] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadingPages, setLoadingPages] = useState(true);
  const [error, setError] = useState("");
  const [selectedPage, setSelectedPage] = useState(null);
  const [user, setUser] = useState(null);
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
      setPages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPages(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const newPage = await createPage(title, content);
      setPages((prev) => [newPage, ...prev]);
      setTitle("");
      setContent("");
      setSelectedPage(newPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
            alt="Notion"
          />
          <span>{user?.name ?? "My Workspace"}</span>
        </div>

        <p className="dash-label">Pages</p>
        {pages.map((page) => (
          <button
            key={page.id}
            className="dash-page-link"
            onClick={() => setSelectedPage(page)}
          >
            📄 {page.title}
          </button>
        ))}

        <button
          className="dash-new-btn"
          onClick={() => { setSelectedPage(null); setError(""); }}
        >
          + New page
        </button>

        <button className="dash-logout-btn" onClick={handleLogout}>
          ← Log out ({user?.email})
        </button>
      </aside>

      <main className="dash-main">
        {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

        {selectedPage ? (
          <div>
            <h1 style={{ fontSize: "1.8rem", marginBottom: 8 }}>{selectedPage.title}</h1>
            <p style={{ color: "#555", fontSize: "0.8rem", marginBottom: 24 }}>
              Created {new Date(selectedPage.created_at).toLocaleDateString()}
            </p>
            <p style={{ color: "#ccc", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {selectedPage.content || <em style={{ color: "#444" }}>No content yet.</em>}
            </p>
          </div>
        ) : (
          <>
            <div className="dash-create-box">
              <h3>✏️ Create a new page</h3>
              <form onSubmit={handleCreate}>
                <div className="field-group">
                  <label>Title</label>
                  <input
                    type="text"
                    placeholder="Page title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label>Content</label>
                  <textarea
                    placeholder="Write something..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
                <button className="btn-primary" type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create page"}
                </button>
              </form>
            </div>

            <div className="dash-pages-section">
              <h3>Your pages</h3>
              {loadingPages ? (
                <p className="dash-empty">Loading pages...</p>
              ) : pages.length === 0 ? (
                <p className="dash-empty">No pages yet. Create your first one above!</p>
              ) : (
                pages.map((page) => (
                  <div
                    key={page.id}
                    className="dash-page-card"
                    onClick={() => setSelectedPage(page)}
                  >
                    <h4>{page.title}</h4>
                    <p>
                      {page.content
                        ? page.content.slice(0, 100) + (page.content.length > 100 ? "..." : "")
                        : "No content"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
