
import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Notion Clone",
  description: "A Notion-style note-taking app",
};


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