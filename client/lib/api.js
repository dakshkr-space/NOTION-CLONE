// The base URL of your Go backend (main.go listens on :3000)
// Every API call in this file starts with this
const API_BASE = "http://localhost:3000";

// ─── AUTH ─────────────────────────────────────────────────────────────────────

// Sends email + password to your Go Login handler
// Returns { token, user } on success
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

// Sends name + email + password to your Go Register handler
// Returns { token, user } on success
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

// Google login is just a redirect — no fetch needed
// The Go backend handles the entire OAuth flow
// and redirects back to /dashboard?token=... when done
export function loginWithGoogle() {
  window.location.href = `${API_BASE}/auth/google`;
}

// ─── TOKEN HELPERS ─────────────────────────────────────────────────────────────

// Save token + user to localStorage after login/register
export function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

// Get the stored token (used in every protected API call as Bearer token)
export function getToken() {
  return localStorage.getItem("token");
}

// Get the stored user object
export function getUser() {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}

// Clear token + user (logout)
export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// ─── PAGES ────────────────────────────────────────────────────────────────────

// Fetch all pages belonging to the logged-in user
// Sends the JWT as Authorization: Bearer <token>
// Your Go GetPages handler reads userID from that token
export async function getPages() {
  const res = await fetch(`${API_BASE}/pages`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch pages");
  return data;
}

// Create a new page
// title and content match what your Go CreatePage handler expects
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