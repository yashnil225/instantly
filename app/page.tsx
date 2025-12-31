import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to campaigns by default. 
  // Middleware will catch unauthenticated users and send them to /login
  redirect("/campaigns")
}
