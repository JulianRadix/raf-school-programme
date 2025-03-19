import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Get a specific grade by ID
export async function GET(_: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const gradeResult = await query(
      `
      SELECT 
        g.*,
        s.name as student_name,
        a.title as assignment_title,
        c.title as class_title
      FROM 
        grades g
      JOIN 
        students s ON g.student_id = s.id
      JOIN 
        assignments a ON g.assignment_id = a.id
      JOIN 
        classes c ON a.class_id = c.id
      WHERE 
        g.id = ?
    `,
      [id]
    );

    if (!Array.isArray(gradeResult) || gradeResult.length === 0) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    return NextResponse.json(gradeResult[0]);
  } catch (error) {
    console.error("Error fetching grade:", error);
    return NextResponse.json({ error: "Failed to fetch grade" }, { status: 500 });
  }
}

// Update a grade
export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const body = await request.json();
    const { grade, percentage, feedback } = body;

    // Validate required fields
    if (!grade || percentage === undefined) {
      return NextResponse.json({ error: "Grade and percentage are required" }, { status: 400 });
    }

    // Check if grade exists
    const existingGradeResult = await query("SELECT id FROM grades WHERE id = ?", [id]);
    if (!Array.isArray(existingGradeResult) || existingGradeResult.length === 0) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    // Update grade
    await query("UPDATE grades SET grade = ?, percentage = ?, feedback = ? WHERE id = ?", [
      grade,
      percentage,
      feedback || null,
      id,
    ]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error updating grade:", error);
    return NextResponse.json({ error: "Failed to update grade" }, { status: 500 });
  }
}

// Delete a grade
export async function DELETE(_: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;

    // Check if grade exists
    const existingGradeResult = await query("SELECT id FROM grades WHERE id = ?", [id]);
    if (!Array.isArray(existingGradeResult) || existingGradeResult.length === 0) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    // Delete grade
    await query("DELETE FROM grades WHERE id = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting grade:", error);
    return NextResponse.json({ error: "Failed to delete grade" }, { status: 500 });
  }
}
