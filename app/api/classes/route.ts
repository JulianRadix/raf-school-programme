import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const classes = await query("SELECT * FROM classes ORDER BY title")
    return NextResponse.json(classes)
  } catch (error) {
    console.error("Error fetching classes:", error)
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 })
  }
}

