import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const squadronFilter = searchParams.get("squadron")
    const yearFilter = searchParams.get("year")
    const searchQuery = searchParams.get("search")
    
    let sql = "SELECT * FROM students"
    const params: any[] = []
    
    // Build WHERE clause based on filters
    const conditions: string[] = []
    
    if (squadronFilter) {
      conditions.push("squadron = ?")
      params.push(squadronFilter)
    }
    
    if (yearFilter) {
      conditions.push("year = ?")
      params.push(yearFilter)
    }
    
    if (searchQuery) {
      conditions.push("(name LIKE ? OR rank LIKE ? OR email LIKE ?)")
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`)
    }
    
    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ")
    }
    
    sql += " ORDER BY name"
    
    const students = await query(sql, params)
    return NextResponse.json(students)
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, rank, squadron, year, email } = body
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }
    
    // Insert new student
    const result = await query(
      "INSERT INTO students (name, rank, squadron, year, email) VALUES (?, ?, ?, ?, ?)",
      [name, rank || null, squadron || null, year || null, email || null]
    )
    
    // Get the inserted ID
    const insertId = (result as any).insertId
    
    return NextResponse.json({ success: true, id: insertId })
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    )
  }
}
