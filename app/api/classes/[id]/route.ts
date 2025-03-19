import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// Get a specific class by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const classData = await query("SELECT * FROM classes WHERE id = ?", [id])

    if (!Array.isArray(classData) || classData.length === 0) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Get class schedule
    const schedule = await query("SELECT * FROM class_schedule WHERE class_id = ?", [id])

    // Get enrolled students count
    const enrollmentResult = await query(
      `
      SELECT COUNT(DISTINCT student_id) as enrolled_count
      FROM attendance
      WHERE class_id = ?
    `,
      [id],
    )

    const enrolledCount =
      Array.isArray(enrollmentResult) && enrollmentResult.length > 0 ? (enrollmentResult[0] as any).enrolled_count : 0

    return NextResponse.json({
      ...classData[0],
      schedule: schedule || [],
      enrolled_count: enrolledCount,
    })
  } catch (error) {
    console.error("Error fetching class:", error)
    return NextResponse.json({ error: "Failed to fetch class" }, { status: 500 })
  }
}

// Update a class
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const { title, description, instructor, room } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Check if class exists
    const existingClass = await query("SELECT id FROM classes WHERE id = ?", [id])
    if (!Array.isArray(existingClass) || existingClass.length === 0) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Update class
    await query("UPDATE classes SET title = ?, description = ?, instructor = ?, room = ? WHERE id = ?", [
      title,
      description || null,
      instructor || null,
      room || null,
      id,
    ])

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Error updating class:", error)
    return NextResponse.json({ error: "Failed to update class" }, { status: 500 })
  }
}

// Delete a class
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if class exists
    const existingClass = await query("SELECT id FROM classes WHERE id = ?", [id])
    if (!Array.isArray(existingClass) || existingClass.length === 0) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Delete class
    await query("DELETE FROM classes WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting class:", error)
    return NextResponse.json({ error: "Failed to delete class" }, { status: 500 })
  }
}

