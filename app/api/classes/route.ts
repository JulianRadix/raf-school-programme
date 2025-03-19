import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get("search")
    
    let sql = "SELECT * FROM classes"
    const params: any[] = []
    
    if (searchQuery) {
      sql += " WHERE title LIKE ? OR instructor LIKE ? OR room LIKE ?"
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`)
    }
    
    sql += " ORDER BY title"
    
    const classes = await query(sql, params)
    return NextResponse.json(classes)
  } catch (error) {
    console.error("Error fetching classes:", error)
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, instructor, room } = body
    
    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }
    
    // Insert new class
    const result = await query(
      "INSERT INTO classes (title, description, instructor, room) VALUES (?, ?, ?, ?)",
      [title, description || null, instructor || null, room || null]
    )
    
    // Get the inserted ID
    const insertId = (result as any).insertId
    
    return NextResponse.json({ success: true, id: insertId })
  } catch (error) {
    console.error("Error creating class:", error)
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    )
  }
}
