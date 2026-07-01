
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
    <head>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
    </head>
    <body>{children}</body>
  </html>
);
}