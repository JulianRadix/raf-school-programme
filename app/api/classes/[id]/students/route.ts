import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    // Get students in this class
    const students = await query(
      `
      SELECT DISTINCT
        s.*,
        a.status,
        a.date
      FROM 
        students s
      JOIN 
        attendance a ON s.id = a.student_id
      WHERE 
        a.class_id = ? AND a.date = ?
      ORDER BY 
        s.name
    `,
      [id, date],
    )

    // Get attendance statistics for this class
    const statsResult = await query(
      `
      SELECT 
        COUNT(DISTINCT student_id) as total_students,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'authorized_leave' THEN 1 END) as authorized_count,
        COUNT(CASE WHEN status = 'medical' THEN 1 END) as medical_count,
        COUNT(CASE WHEN status = 'unauthorized' THEN 1 END) as unauthorized_count
      FROM 
        attendance
      WHERE 
        class_id = ? AND date = ?
    `,
      [id, date],
    )

    const stats =
      Array.isArray(statsResult) && statsResult.length > 0
        ? statsResult[0]
        : {
            total_students: 0,
            present_count: 0,
            absent_count: 0,
            authorized_count: 0,
            medical_count: 0,
            unauthorized_count: 0,
          }

    // Calculate attendance rate
    const attendanceRate =
      (stats as any).total_students > 0
        ? Math.round(((stats as any).present_count / (stats as any).total_students) * 100)
        : 0

    return NextResponse.json({
      students,
      stats: {
        ...stats,
        attendanceRate,
      },
      date,
    })
  } catch (error) {
    console.error("Error fetching class students:", error)
    return NextResponse.json({ error: "Failed to fetch class students" }, { status: 500 })
  }
}

