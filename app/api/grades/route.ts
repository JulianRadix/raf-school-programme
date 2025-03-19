import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const assignmentId = searchParams.get("assignmentId")
    const classId = searchParams.get("classId")
    const recent = searchParams.get("recent") === "true"
    const days = Number.parseInt(searchParams.get("days") || "14", 10)

    let sql = `
      SELECT 
        g.*, 
        s.name as student_name, 
        a.title as assignment_title, 
        c.title as class_title
      FROM grades g
      JOIN students s ON g.student_id = s.id
      JOIN assignments a ON g.assignment_id = a.id
      JOIN classes c ON a.class_id = c.id
    `

    const params: any[] = []
    const conditions: string[] = []

    if (studentId) {
      conditions.push("g.student_id = ?")
      params.push(studentId)
    }

    if (assignmentId) {
      conditions.push("g.assignment_id = ?")
      params.push(assignmentId)
    }

    if (classId) {
      conditions.push("a.class_id = ?")
      params.push(classId)
    }

    if (recent) {
      conditions.push("g.submitted_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)")
      params.push(days)
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ")
    }

    sql += " ORDER BY g.submitted_at DESC"

    if (!recent && !studentId && !assignmentId && !classId) {
      sql += " LIMIT 100"
    }

    const grades = await query(sql, params)
    return NextResponse.json(grades)
  } catch (error) {
    console.error("Error fetching grades:", error)
    return NextResponse.json({ error: "Failed to fetch grades" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { student_id, assignment_id, grade, percentage, feedback } = body
    
    // Validate required fields
    if (!student_id || !assignment_id || !grade || percentage === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    // Check if student exists
    const studentExists = await query("SELECT id FROM students WHERE id = ?", [student_id])
    if (!Array.isArray(studentExists) || studentExists.length === 0) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      )
    }
    
    // Check if assignment exists
    const assignmentExists = await query("SELECT id FROM assignments WHERE id = ?", [assignment_id])
    if (!Array.isArray(assignmentExists) || assignmentExists.length === 0) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }
    
    // Check if grade already exists for this student and assignment
    const existingGrade = await query(
      "SELECT id FROM grades WHERE student_id = ? AND assignment_id = ?",
      [student_id, assignment_id]
    )
    
    let result
    
    if (Array.isArray(existingGrade) && existingGrade.length > 0) {
      // Update existing grade
      result = await query(
        "UPDATE grades SET grade = ?, percentage = ?, feedback = ? WHERE student_id = ? AND assignment_id = ?",
        [grade, percentage, feedback || null, student_id, assignment_id]
      )
      
      return NextResponse.json({ 
        success: true, 
        id: (existingGrade[0] as any).id,
        updated: true 
      })
    } else {
      // Insert new grade
      result = await query(
        "INSERT INTO grades (student_id, assignment_id, grade, percentage, feedback) VALUES (?, ?, ?, ?, ?)",
        [student_id, assignment_id, grade, percentage, feedback || null]
      )
      
      return NextResponse.json({ 
        success: true, 
        id: (result as any).insertId,
        updated: false 
      })
    }
  } catch (error) {
    console.error("Error saving grade:", error)
    return NextResponse.json(
      { error: "Failed to save grade" },
      { status: 500 }
    )
  }
}
