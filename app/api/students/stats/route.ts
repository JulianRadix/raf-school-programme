import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Get total students count
    const totalResult = await query("SELECT COUNT(*) as total FROM students")
    const total = Array.isArray(totalResult) && totalResult.length > 0 ? (totalResult[0] as any).total : 0

    // Get squadron distribution
    const squadronResult = await query(`
      SELECT squadron, COUNT(*) as count
      FROM students 
      WHERE squadron IS NOT NULL 
      GROUP BY squadron 
      ORDER BY COUNT(*) DESC
    `)
    
    // Get year distribution
    const yearResult = await query(`
      SELECT year, COUNT(*) as count 
      FROM students 
      WHERE year IS NOT NULL 
      GROUP BY year 
      ORDER BY year
    `)
    
    // Get rank distribution
    const rankResult = await query(`
      SELECT \`rank\`, COUNT(*) as count
      FROM students
      WHERE \`rank\` IS NOT NULL
      GROUP BY \`rank\`
      ORDER BY count DESC
    `);

    // Get students with highest attendance
    const attendanceResult = await query(`
      SELECT 
        s.id,
        s.name,
        s.rank,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(a.id) as total_count
      FROM 
        students s
      JOIN 
        attendance a ON s.id = a.student_id
      GROUP BY 
        s.id, s.name, s.rank
      HAVING 
        COUNT(a.id) > 0
      ORDER BY 
        present_count / total_count DESC
      LIMIT 5
    `)

    // Calculate attendance rates
    const topAttendance = Array.isArray(attendanceResult)
      ? attendanceResult.map((student: any) => ({
          id: student.id,
          name: student.name,
          rank: student.rank,
          rate: student.total_count > 0 ? Math.round((student.present_count / student.total_count) * 100) : 0,
        }))
      : []

    return NextResponse.json({
      total,
      squadrons: squadronResult,
      years: yearResult,
      ranks: rankResult,
      topAttendance,
    })
  } catch (error) {
    console.error("Error fetching student statistics:", error)
    return NextResponse.json({ error: "Failed to fetch student statistics" }, { status: 500 })
  }
}

