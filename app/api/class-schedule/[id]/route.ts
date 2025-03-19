import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// Get a specific schedule entry by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const scheduleEntry = await query(
      `
      SELECT 
        cs.*,
        c.title,
        c.instructor,
        c.room
      FROM 
        class_schedule cs
      JOIN 
        classes c ON cs.class_id = c.id
      WHERE 
        cs.id = ?
    `,
      [id],
    )

    if (!Array.isArray(scheduleEntry) || scheduleEntry.length === 0) {
      return NextResponse.json({ error: "Schedule entry not found" }, { status: 404 })
    }

    return NextResponse.json(scheduleEntry[0])
  } catch (error) {
    console.error("Error fetching schedule entry:", error)
    return NextResponse.json({ error: "Failed to fetch schedule entry" }, { status: 500 })
  }
}

// Update a schedule entry
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const { class_id, day_of_week, start_time, end_time } = body

    // Validate required fields
    if (!class_id || day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if schedule entry exists
    const existingEntry = await query("SELECT id FROM class_schedule WHERE id = ?", [id])
    if (!Array.isArray(existingEntry) || existingEntry.length === 0) {
      return NextResponse.json({ error: "Schedule entry not found" }, { status: 404 })
    }

    // Update schedule entry
    await query("UPDATE class_schedule SET class_id = ?, day_of_week = ?, start_time = ?, end_time = ? WHERE id = ?", [
      class_id,
      day_of_week,
      start_time,
      end_time,
      id,
    ])

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Error updating schedule entry:", error)
    return NextResponse.json({ error: "Failed to update schedule entry" }, { status: 500 })
  }
}

// Delete a schedule entry
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if schedule entry exists
    const existingEntry = await query("SELECT id FROM class_schedule WHERE id = ?", [id])
    if (!Array.isArray(existingEntry) || existingEntry.length === 0) {
      return NextResponse.json({ error: "Schedule entry not found" }, { status: 404 })
    }

    // Delete schedule entry
    await query("DELETE FROM class_schedule WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting schedule entry:", error)
    return NextResponse.json({ error: "Failed to delete schedule entry" }, { status: 500 })
  }
}

