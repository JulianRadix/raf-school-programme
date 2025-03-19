import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Get total grades count
    const totalResult = await query("SELECT COUNT(*) as total FROM grades")
    const total = Array.isArray(totalResult) && totalResult.length > 0 
      ? (totalResult[0] as any).total 
      : 0
    
    // Get average grade percentage
    const avgResult = await query("SELECT AVG(percentage) as average FROM grades")
    const average = Array.isArray(avgResult) && avgResult.length > 0 
      ? Math.round((avgResult[0] as any).average || 0) 
      : 0
    
    // Get grade distribution
    const distributionResult = await query(`
      SELECT 
        CASE 
          WHEN percentage >= 90 THEN 'A'
          WHEN percentage >= 80 THEN 'B'
          WHEN percentage >= 70 THEN 'C'
          WHEN percentage >= 60 THEN 'D'
          ELSE 'F'
        END as grade_letter,
        COUNT(*) as count
      FROM 
        grades
      GROUP BY 
        grade_letter
      ORDER BY 
        grade_letter
    `)
    
    // Get top performing students
    const topStudentsResult = await query(`
      SELECT 
        s.id,
        s.name,
        AVG(g.percentage) as average_grade,
        COUNT(g.id) as assignments_count
      FROM 
        students s
      JOIN 
        grades g ON s.id = g.student_id
      GROUP BY 
        s.id, s.name
      HAVING 
        COUNT(g.id) > 0
      ORDER BY 
        average_grade DESC
      LIMIT 5
    `)
    
    const topStudents = Array.isArray(topStudentsResult)
      ? topStudentsResult.map((student: any) => ({
          id: student.id,
          name: student.name,
          average_grade: Math.round(student.average_grade),
          assignments_count: student.assignments_count
        }))
      : []
    
    return NextResponse.json({
      total,
      average,
      distribution: distributionResult,
      topStudents
    })
  } catch (error) {
    console.error("Error fetching grade statistics:", error)
    return NextResponse.json(
      { error: "Failed to fetch grade statistics" },
      { status: 500 }
    )
  }
}
