import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const recent = searchParams.get("recent") === "true"
    const days = Number.parseInt(searchParams.get("days") || "14", 10)

    let sql = `
      SELECT 
        g.*, 
        s.name as student_name, 
        a.title as assignment_title, 
        c.title as class_title
      FROM grades g
      JOIN students s ON g.student_id = s.id
      JOIN assignments a ON g.assignment_id = a.id
      JOIN classes c ON a.class_id = c.id
    `

    const params: any[] = []

    if (studentId) {
      sql += " WHERE g.student_id = ?"
      params.push(studentId)
    }

    if (recent) {
      if (params.length > 0) {
        sql += " AND"
      } else {
        sql += " WHERE"
      }
      sql += " g.submitted_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)"
      params.push(days)
    }

    sql += " ORDER BY g.submitted_at DESC LIMIT 10"

    const grades = await query(sql, params)
    return NextResponse.json(grades)
  } catch (error) {
    console.error("Error fetching grades:", error)
    return NextResponse.json({ error: "Failed to fetch grades" }, { status: 500 })
  }
}

