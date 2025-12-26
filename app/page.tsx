"use client"

import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to campaigns page (main dashboard)
  redirect("/campaigns")
}
