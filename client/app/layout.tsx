// layout.tsx is the ROOT WRAPPER for every page in your Next.js app.
// Whatever you put here appears on ALL pages (login, dashboard, etc.)
// Think of it like a master template.

import type { Metadata } from "next";
import "./globals.css";

// Metadata is Next.js's way of setting <title> and <meta> tags
// for the whole app (can be overridden per page)
export const metadata: Metadata = {
  title: "Notion Clone",
  description: "A Notion-style note-taking app",
};

// RootLayout receives "children" — this is whatever page
// is currently being shown (login page, dashboard page, etc.)
// Next.js automatically passes the right page as children
// based on the URL the user is on
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/*
        children renders inside <body> —
        so login page renders here when user is on /login,
        dashboard renders here when user is on /dashboard, etc.
      */}
      <body>{children}</body>
    </html>
  );
}