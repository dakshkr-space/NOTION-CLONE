// This file handles the root URL: http://localhost:3001/
// We don't want anything at "/" — we just redirect straight to /login
// redirect() is a Next.js built-in that sends the user to another route
import { redirect } from "next/navigation";

export default function Home() {
  // As soon as someone visits "/", they get sent to "/login" immediately
  redirect("/login");
}