import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    
    const sql = `
      SELECT 
        a.id, 
        a.student_id, 
        a.class_id, 
        a.date, 
        a.status, 
        a.notes,
        s.name, 
        s.rank,
        c.title as class_title
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      WHERE 
        a.status != 'present' 
        AND a.date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      ORDER BY a.date DESC
      LIMIT 10
    `;
    
    const absences = await query(sql, [days]);
    return NextResponse.json(absences);
  } catch (error) {
    console.error('Error fetching recent absences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent absences' },
      { status: 500 }
    );
  }
}
