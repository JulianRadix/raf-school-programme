import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const day = searchParams.get("day")
    const today = searchParams.get("today") === "true"

    let sql = `
      SELECT cs.*, c.title, c.room, c.instructor
      FROM class_schedule cs
      JOIN classes c ON cs.class_id = c.id
    `

    const params: any[] = []

    if (today) {
      const currentDay = new Date().getDay()
      const mysqlDay = currentDay === 0 ? 7 : currentDay
      sql += " WHERE cs.day_of_week = ?"
      params.push(mysqlDay)
    } else if (day) {
      sql += " WHERE cs.day_of_week = ?"
      params.push(day)
    }

    sql += " ORDER BY cs.start_time"

    const schedule = await query(sql, params)

    const enrichedSchedule = await Promise.all(
      Array.isArray(schedule)
        ? schedule.map(async (cls: any) => {
            const today = new Date().toISOString().split("T")[0]

            const attendanceQuery = `
          SELECT 
            COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
            COUNT(*) as total_count
          FROM attendance
          WHERE class_id = ? AND date = ?
        `

            const attendanceResult = await query(attendanceQuery, [cls.class_id, today]) as { present_count: number; total_count: number }[]
            const attendance = Array.isArray(attendanceResult) && attendanceResult.length > 0 ? attendanceResult[0] : { present_count: 0, total_count: 0 }

            return {
              ...cls,
              attendance: attendance.present_count || 0,
              total: attendance.total_count || 0,

              time: `${cls.start_time.substring(0, 5)} - ${cls.end_time.substring(0, 5)}`,
            }
          })
        : [],
    )

    return NextResponse.json(enrichedSchedule)
  } catch (error) {
    console.error("Error fetching class schedule:", error)
    return NextResponse.json({ error: "Failed to fetch class schedule" }, { status: 500 })
  }
}

