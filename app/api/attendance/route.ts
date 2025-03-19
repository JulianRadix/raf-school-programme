import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0]
  const classId = searchParams.get("classId")

  try {
    let sql = `
      SELECT a.*, s.name, s.rank, c.title as class_title
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      WHERE a.date = ?
    `
    const params: any[] = [date]

    if (classId) {
      sql += " AND a.class_id = ?"
      params.push(classId)
    }

    const attendance = await query(sql, params)
    return NextResponse.json(attendance)
  } catch (error) {
    console.error("Error fetching attendance:", error)
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { student_id, class_id, date, status, notes } = body

    if (!student_id || !class_id || !date || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existing = await query("SELECT id FROM attendance WHERE student_id = ? AND class_id = ? AND date = ?", [
      student_id,
      class_id,
      date,
    ])

    if (Array.isArray(existing) && existing.length > 0) {
      await query("UPDATE attendance SET status = ?, notes = ? WHERE student_id = ? AND class_id = ? AND date = ?", [
        status,
        notes || null,
        student_id,
        class_id,
        date,
      ])
    } else {
      await query("INSERT INTO attendance (student_id, class_id, date, status, notes) VALUES (?, ?, ?, ?, ?)", [
        student_id,
        class_id,
        date,
        status,
        notes || null,
      ])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error recording attendance:", error)
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 })
  }
}

