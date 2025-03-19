import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// Get a specific student by ID
export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    const id = context.params.id
    const student = await query("SELECT * FROM students WHERE id = ?", [id])

    if (!Array.isArray(student) || student.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    return NextResponse.json(student[0])
  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 })
  }
}

// Update a student
export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const id = context.params.id
    const body = await request.json()
    const { name, rank, squadron, year, email } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Check if student exists
    const existingStudent = await query("SELECT id FROM students WHERE id = ?", [id])
    if (!Array.isArray(existingStudent) || existingStudent.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Update student
    await query("UPDATE students SET name = ?, rank = ?, squadron = ?, year = ?, email = ? WHERE id = ?", [
      name,
      rank || null,
      squadron || null,
      year || null,
      email || null,
      id,
    ])

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 })
  }
}

// Delete a student
export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    const id = context.params.id

    // Check if student exists
    const existingStudent = await query("SELECT id FROM students WHERE id = ?", [id])
    if (!Array.isArray(existingStudent) || existingStudent.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Delete student
    await query("DELETE FROM students WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}

