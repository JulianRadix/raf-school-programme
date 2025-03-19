import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10", 10)
    
    // Get student's grades
    const grades = await query(`
      SELECT 
        g.*,
        a.title as assignment_title,
        a.due_date,
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
    `, [id, limit])
    
    // Get grade statistics
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_assignments,
        AVG(percentage) as average_percentage
      FROM 
        grades
      WHERE 
        student_id = ?
    `, [id])
    
    const stats = Array.isArray(statsResult) && statsResult.length > 0 
      ? statsResult[0] 
      : {
          total_assignments: 0,
          average_percentage: 0
        }
    
    // Round the average percentage
    if (stats && (stats as any).average_percentage) {
      (stats as any).average_percentage = Math.round((stats as any).average_percentage)
    }
    
    return NextResponse.json({
      grades,
      stats
    })
  } catch (error) {
    console.error("Error fetching student grades:", error)
    return NextResponse.json(
      { error: "Failed to fetch student grades" },
      { status: 500 }
    )
  }
}
