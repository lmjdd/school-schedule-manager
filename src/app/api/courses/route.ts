import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const courses = await db.course.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });
    return NextResponse.json(courses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const course = await db.course.create({
      data: {
        name: body.name,
        teacher: body.teacher || null,
        location: body.location || null,
        credit: body.credit || 0,
        category: body.category || '必修',
        color: body.color || '#6366f1',
        dayOfWeek: body.dayOfWeek || 1,
        startTime: body.startTime || '08:00',
        endTime: body.endTime || '09:40',
        startWeek: body.startWeek || 1,
        endWeek: body.endWeek || 16,
        semester: body.semester || '2024-2025-2',
      },
    });
    return NextResponse.json(course);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const course = await db.course.update({
      where: { id: body.id },
      data: {
        name: body.name,
        teacher: body.teacher,
        location: body.location,
        credit: body.credit,
        category: body.category,
        color: body.color,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        startWeek: body.startWeek,
        endWeek: body.endWeek,
        semester: body.semester,
      },
    });
    return NextResponse.json(course);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    await db.course.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
