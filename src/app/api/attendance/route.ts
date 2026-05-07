import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: Record<string, unknown> = {};

    if (courseId) {
      where.courseId = courseId;
    }
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) (where.date as Record<string, unknown>).gte = dateFrom;
      if (dateTo) (where.date as Record<string, unknown>).lte = dateTo;
    }

    const records = await db.attendance.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { course: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Attendance GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, date, status, note } = body;

    if (!courseId || !date || !status) {
      return NextResponse.json(
        { error: 'courseId, date, and status are required' },
        { status: 400 }
      );
    }

    if (!['present', 'absent', 'late', 'leave'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be one of: present, absent, late, leave' },
        { status: 400 }
      );
    }

    // Check for duplicate record (same course + same date)
    const existing = await db.attendance.findFirst({
      where: { courseId, date },
    });

    if (existing) {
      // Update existing record instead
      const updated = await db.attendance.update({
        where: { id: existing.id },
        data: { status, note: note || null },
        include: { course: true },
      });
      return NextResponse.json(updated);
    }

    const record = await db.attendance.create({
      data: {
        courseId,
        date,
        status,
        note: note || null,
      },
      include: { course: true },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Attendance POST error:', error);
    return NextResponse.json({ error: 'Failed to create attendance record' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, note, date } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (note !== undefined) data.note = note;
    if (date) data.date = date;

    const record = await db.attendance.update({
      where: { id },
      data,
      include: { course: true },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Attendance PUT error:', error);
    return NextResponse.json({ error: 'Failed to update attendance record' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.attendance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Attendance DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete attendance record' }, { status: 500 });
  }
}
