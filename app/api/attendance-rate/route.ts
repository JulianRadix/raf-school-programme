import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    
    const sql = `
      SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(*) as total_count
      FROM attendance
      WHERE date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
    `;
    
    const result = await query(sql, [days]);
    
    if (!Array.isArray(result) || result.length === 0) {
      return NextResponse.json({ rate: 0, change: 0 });
    }
    
    const { present_count, total_count } = result[0] as any;
    const rate = total_count > 0 ? (present_count / total_count) * 100 : 0;

    const previousPeriodSql = `
      SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(*) as total_count
      FROM attendance
      WHERE 
        date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY) 
        AND date < DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
    `;
    
    const previousResult = await query(previousPeriodSql, [days * 2, days]);
    
    let change = 0;
    if (Array.isArray(previousResult) && previousResult.length > 0) {
      const { present_count: prev_present, total_count: prev_total } = previousResult[0] as any;
      const previousRate = prev_total > 0 ? (prev_present / prev_total) * 100 : 0;
      change = rate - previousRate;
    }
    
    return NextResponse.json({ 
      rate: parseFloat(rate.toFixed(1)), 
      change: parseFloat(change.toFixed(1)),
      present_count,
      total_count
    });
  } catch (error) {
    console.error('Error calculating attendance rate:', error);
    return NextResponse.json(
      { error: 'Failed to calculate attendance rate' },
      { status: 500 }
    );
  }
}
