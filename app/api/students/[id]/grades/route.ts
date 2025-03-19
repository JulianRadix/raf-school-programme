import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(_: Request, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;

    const { searchParams } = new URL(_.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

    // Get student grades
    const grades = await query(
      `
      SELECT 
        g.*,
        a.title as assignment_title,
        c.title as class_title
      FROM 
        grades g
      JOIN 
        assignments a ON g.assignment_id = a.id
      JOIN 
        classes c ON a.class_id = c.id
      WHERE 
        g.student_id = ?
      ORDER BY 
        g.submitted_at DESC
      LIMIT ?
    `,
      [id, limit],
    )

    // Get grade statistics
    const statsResult = await query(
      `
      SELECT 
        COUNT(*) as total_count,
        AVG(percentage) as average_grade,
        MAX(percentage) as highest_grade,
        MIN(percentage) as lowest_grade
      FROM 
        grades
      WHERE 
        student_id = ?
    `,
      [id],
    )

    const stats =
      Array.isArray(statsResult) && statsResult.length > 0
        ? {
            total_count: (statsResult[0] as any).total_count || 0,
            average_grade: Math.round((statsResult[0] as any).average_grade || 0),
            highest_grade: (statsResult[0] as any).highest_grade || 0,
            lowest_grade: (statsResult[0] as any).lowest_grade || 0,
          }
        : {
            total_count: 0,
            average_grade: 0,
            highest_grade: 0,
            lowest_grade: 0,
          }

    return NextResponse.json({
      grades,
      stats,
    })
  } catch (error) {
    console.error("Error fetching student grades:", error)
    return NextResponse.json({ error: "Failed to fetch student grades" }, { status: 500 })
  }
}
