// The base URL of Go backend (main.go listens on :3000)

const API_BASE = "http://localhost:3000";

// AUTH 

export async function loginWithEmail(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}


export async function registerWithEmail(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
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



export function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem("token");
}


export function getUser() {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}


export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

//PAGES 


export async function getPages() {
  const res = await fetch(`${API_BASE}/pages`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch pages");
  return data;
}

// Create a new page
export async function createPage(title, content) {
  const res = await fetch(`${API_BASE}/pages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ title, content }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create page");
  return data;
}

// Fetch child pages of a given parent page ID
export async function getChildPages(parentId) {
  const res = await fetch(`${API_BASE}/pages/${parentId}/children`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch child pages");
  return data;
}

// Create a subpage under a parent page
export async function createSubPage(title, content, parentId) {
  const res = await fetch(`${API_BASE}/pages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ title, content, parent_id: parentId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create subpage");
  return data;
}

// Update an existing page (used for auto-save)
export async function updatePage(id, title, content) {
  const res = await fetch(`${API_BASE}/pages/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ title, content }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update page");
  return data;
}

// Generate a share link for a page
export async function sharePage(pageId) {
  const res = await fetch(`${API_BASE}/pages/${pageId}/share`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate share link");
  return data;
}

// Fetch a publicly shared page by token (no auth needed)
export async function getSharedPage(token) {
  const res = await fetch(`${API_BASE}/shared/${token}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Page not found");
  return data;
}