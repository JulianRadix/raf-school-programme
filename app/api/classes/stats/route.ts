import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Get total classes count
    const totalResult = await query("SELECT COUNT(*) as total FROM classes")
    const total = Array.isArray(totalResult) && totalResult.length > 0 
      ? (totalResult[0] as any).total 
      : 0
    
    // Get classes with highest attendance
    const attendanceResult = await query(`
      SELECT 
        c.id,
        c.title,
        COUNT(DISTINCT a.student_id) as student_count,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(a.id) as total_count
      FROM 
        classes c
      LEFT JOIN 
        attendance a ON c.id = a.class_id
      GROUP BY 
        c.id, c.title
      ORDER BY 
        present_count DESC
      LIMIT 5
    `)
    
    // Calculate attendance rates
    const topAttendance = Array.isArray(attendanceResult) 
      ? attendanceResult.map((cls: any) => ({
          id: cls.id,
          title: cls.title,
          student_count: cls.student_count,
          rate: cls.total_count > 0 
            ? Math.round((cls.present_count / cls.total_count) * 100) 
            : 0
        }))
      : []
    
    // Get instructor distribution
    const instructorResult = await query(`
      SELECT instructor, COUNT(*) as count 
      FROM classes 
      WHERE instructor IS NOT NULL 
      GROUP BY instructor 
      ORDER BY count DESC
    `)
    
    return NextResponse.json({
      total,
      topAttendance,
      instructors: instructorResult
    })
  } catch (error) {
    console.error("Error fetching class statistics:", error)
    return NextResponse.json(
      { error: "Failed to fetch class statistics" },
      { status: 500 }
    )
  }
}
