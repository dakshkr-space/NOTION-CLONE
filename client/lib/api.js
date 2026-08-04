// The base URL of Go backend (main.go listens on :3000)

const API_BASE = "http://localhost:3000";

// AUTH 

export async function loginWithEmail(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    credentials: "include", // sends/receives the HttpOnly cookie
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data; // { user } — no token in the body anymore, it's in the cookie
}


export async function registerWithEmail(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data;
}


export function loginWithGoogle() {
  window.location.href = `${API_BASE}/auth/google`;
}

// Ask the backend who's currently logged in, based on the cookie it receives.
// Replaces the old getToken()/getUser()/JWT-decode approach entirely.
export async function getCurrentUser() {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
  if (!res.ok) return null;
  return await res.json();
}

// Replaces clearAuth() — tells the backend to expire the cookie server-side.
export async function logout() {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

//PAGES 


export async function getPages() {
  const res = await fetch(`${API_BASE}/pages`, {
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch pages");
  return data;
}

// Create a new page
export async function createPage(title, content) {
  const res = await fetch(`${API_BASE}/pages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create page");
  return data;
}

// Fetch child pages of a given parent page ID
export async function getChildPages(parentId) {
  const res = await fetch(`${API_BASE}/pages/${parentId}/children`, {
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch child pages");
  return data;
}

// Create a subpage under a parent page
export async function createSubPage(title, content, parentId) {
  const res = await fetch(`${API_BASE}/pages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, parent_id: parentId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create subpage");
  return data;
}

// Update an existing page (used for auto-save)
export async function updatePage(id, title, content) {
  if (!id) return;

  const res = await fetch(`${API_BASE}/pages/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update page (${res.status})`);
  }

  return await res.json();
}

// Generate a share link for a page
export async function sharePage(pageId, role = "viewer") {
  const res = await fetch(`${API_BASE}/pages/${pageId}/share`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate share link");
  return data;
}

// Guest edit via an editor share link — stays public/unauthenticated,
// access is controlled entirely by the share token + its stored role.
export async function updateSharedPage(token, title, content) {
  const res = await fetch(`${API_BASE}/shared/${token}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to save");
  return data;
}

// Fetch a publicly shared page by token (no auth needed)
export async function getSharedPage(token) {
  const res = await fetch(`${API_BASE}/shared/${token}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Page not found");
  return data;
}

// Ask AI with optional page context
export async function askAI(prompt, pageTitle = "", pageContent = "") {
  const res = await fetch(`${API_BASE}/ai/ask`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      page_title: pageTitle,
      page_content: pageContent,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "AI request failed");
  return data;
}

export async function deletePage(id) {
  const res = await fetch(`${API_BASE}/pages/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete page");
  return data;
}

export async function getPageVersions(pageId) {
  const res = await fetch(`${API_BASE}/pages/${pageId}/versions`, {
    credentials: "include",
  });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to fetch page versions");
  return data;
}

export async function restorePageVersion(pageId, versionId) {
  const res = await fetch(`${API_BASE}/pages/${pageId}/versions/${versionId}/restore`, {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to restore version");
  return data;
}

export async function getComments(pageId) {
  if (!pageId) return [];

  const res = await fetch(`${API_BASE}/pages/${pageId}/comments`, {
    credentials: "include",
  });

  if (!res.ok) return [];
  return await res.json();
}

export async function addComment(pageId, content) {
  if (!pageId || !content.trim()) return;

  const res = await fetch(`${API_BASE}/pages/${pageId}/comments`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to post comment");
  }

  return await res.json();
}

export async function reorderPages(pages) {
  const res = await fetch(`${API_BASE}/pages/reorder`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pages }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to reorder pages");
  return data;
}

// WebSocket endpoint for read-only/editor viewers of a shared page (public link).
export function getSharedPageSocketURL(token) {
  return API_BASE.replace(/^http/, "ws") + "/ws/shared/" + token;
}

// WebSocket endpoint for the logged-in owner's dashboard view.
// No ?token= needed anymore — the browser attaches the HttpOnly cookie
// to the WebSocket upgrade request automatically, and the backend reads
// it via conn.Cookies("token") (see PageWebSocket, Step 6).
export function getPageSocketURL(pageId) {
  return API_BASE.replace(/^http/, "ws") + "/ws/pages/" + pageId;
}