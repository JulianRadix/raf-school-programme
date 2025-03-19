import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { RowDataPacket } from "mysql2"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const day = searchParams.get("day")
    const today = searchParams.get("today") === "true"
    const classId = searchParams.get("classId")
    const weekView = searchParams.get("weekView") === "true"

    let sql = `
      SELECT cs.*, c.title, c.room, c.instructor
      FROM class_schedule cs
      JOIN classes c ON cs.class_id = c.id
    `

    const params: any[] = []
    const conditions: string[] = []

    if (today) {
      // Get current day of week (0 = Sunday, 1 = Monday, etc.)
      const currentDay = new Date().getDay()
      // MySQL uses 1-7 for days where 1 = Monday, 7 = Sunday
      // Convert JavaScript day to MySQL day
      const mysqlDay = currentDay === 0 ? 7 : currentDay
      conditions.push("cs.day_of_week = ?")
      params.push(mysqlDay)
    } else if (day) {
      conditions.push("cs.day_of_week = ?")
      params.push(day)
    }

    if (classId) {
      conditions.push("cs.class_id = ?")
      params.push(classId)
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ")
    }

    sql += " ORDER BY cs.day_of_week, cs.start_time"

    const schedule = await query(sql, params)

    // For each class, get the attendance count if today is requested
    if (today) {
      const enrichedSchedule = await Promise.all(
        Array.isArray(schedule)
          ? schedule.map(async (cls: any) => {
              // Get today's date in YYYY-MM-DD format
              const today = new Date().toISOString().split("T")[0]

              // Get attendance count for this class today
              const attendanceQuery = `
                SELECT 
                  COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
                  COUNT(*) as total_count
                FROM attendance
                WHERE class_id = ? AND date = ?
              `

              const attendanceResult = await query(attendanceQuery, [cls.class_id, today])
              const attendance =
                Array.isArray(attendanceResult) && attendanceResult.length > 0
                  ? attendanceResult[0]
                  : { present_count: 0, total_count: 0 }

              return {
                ...cls,
                attendance: (attendance as RowDataPacket).present_count || 0,
                total: (attendance as RowDataPacket).total_count || 0,
                // Format time for display (HH:MM - HH:MM)
                time: `${cls.start_time.substring(0, 5)} - ${cls.end_time.substring(0, 5)}`,
              }
            })
          : []
      )

      return NextResponse.json(enrichedSchedule)
    }

    // If week view is requested, organize by day
    if (weekView) {
      const days = [1, 2, 3, 4, 5, 6, 7] // Monday to Sunday
      const weekSchedule = days.map(day => {
        const dayName = getDayName(day)
        const dayClasses = Array.isArray(schedule) 
          ? schedule.filter((cls: any) => cls.day_of_week === day)
          : []
        
        return {
          day,
          dayName,
          classes: dayClasses.map((cls: any) => ({
            ...cls,
            time: `${cls.start_time.substring(0, 5)} - ${cls.end_time.substring(0, 5)}`,
          }))
        }
      })
      
      return NextResponse.json(weekSchedule)
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Error fetching class schedule:", error)
    return NextResponse.json({ error: "Failed to fetch class schedule" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { class_id, day_of_week, start_time, end_time } = body
    
    // Validate required fields
    if (!class_id || day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    // Check if class exists
    const classExists = await query("SELECT id FROM classes WHERE id = ?", [class_id])
    if (!Array.isArray(classExists) || classExists.length === 0) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      )
    }
    
    // Check for schedule conflicts
    const conflictCheck = await query(`
      SELECT id FROM class_schedule 
      WHERE day_of_week = ? 
      AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))
    `, [day_of_week, end_time, start_time, end_time, start_time])
    
    if (Array.isArray(conflictCheck) && conflictCheck.length > 0) {
      return NextResponse.json(
        { error: "Schedule conflict detected with another class" },
        { status: 409 }
      )
    }
    
    // Insert new schedule entry
    const result = await query(
      "INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)",
      [class_id, day_of_week, start_time, end_time]
    )
    
    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId 
    })
  } catch (error) {
    console.error("Error creating schedule entry:", error)
    return NextResponse.json(
      { error: "Failed to create schedule entry" },
      { status: 500 }
    )
  }
}

// Helper function to get day name
function getDayName(day: number): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return days[day - 1] // Adjust for 1-based index
}
