import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const upcoming = searchParams.get("upcoming") === "true"
    const days = Number.parseInt(searchParams.get("days") || "7", 10)

    let sql = `
      SELECT a.*, c.title as class_title
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
    `

    if (upcoming) {
      sql += ` 
        WHERE a.due_date >= CURRENT_DATE 
        AND a.due_date <= DATE_ADD(CURRENT_DATE, INTERVAL ? DAY)
        ORDER BY a.due_date ASC
      `
      const assignments = await query(sql, [days])

      const enrichedAssignments = Array.isArray(assignments)
        ? assignments.map((assignment: any) => {
            const statuses = ["Not Started", "In Progress"]
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
            return {
              ...assignment,
              status: randomStatus,
            }
          })
        : []

      return NextResponse.json(enrichedAssignments)
    } else {
      sql += " ORDER BY a.due_date DESC"
      const assignments = await query(sql)
      return NextResponse.json(assignments)
    }
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 })
  }
}

