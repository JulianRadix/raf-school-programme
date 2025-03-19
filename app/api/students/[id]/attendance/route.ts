import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(_: Request, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;

    const { searchParams } = new URL(_.url);
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10);

    // Get student attendance records
    const attendance = await query(
      `
      SELECT 
        a.*,
        c.title as class_title,
        c.instructor
      FROM 
        attendance a
      JOIN 
        classes c ON a.class_id = c.id
      WHERE 
        a.student_id = ?
      ORDER BY 
        a.date DESC
      LIMIT ?
    `,
      [id, limit]
    );

    // Get attendance statistics
    const statsResult = await query(`
      SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'authorized_leave' THEN 1 END) as authorized_count,
        COUNT(CASE WHEN status = 'medical' THEN 1 END) as medical_count,
        COUNT(CASE WHEN status = 'unauthorized' THEN 1 END) as unauthorized_count,
        COUNT(*) as total_count
      FROM attendance
      WHERE student_id = ?`,
      [id]
    );
    
    // Ensure statsResult is treated as an array
    const stats = statsResult.length > 0 ? statsResult[0] : {
      present_count: 0,
      absent_count: 0,
      authorized_count: 0,
      medical_count: 0,
      unauthorized_count: 0,
      total_count: 0,
    };

    // Calculate attendance rate
    const attendanceRate = stats.total_count > 0 
      ? Math.round((stats.present_count / stats.total_count) * 100) 
      : 0;

    return NextResponse.json({
      attendance,
      stats: { ...stats, attendanceRate },
    });
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    return NextResponse.json({ error: "Failed to fetch student attendance" }, { status: 500 });
  }
}
