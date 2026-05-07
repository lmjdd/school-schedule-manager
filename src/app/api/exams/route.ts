import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const exams = await db.exam.findMany({
      include: { course: true },
      orderBy: { date: 'asc' },
    });
    return NextResponse.json(exams);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const exam = await db.exam.create({
      data: {
        title: body.title,
        courseId: body.courseId,
        date: new Date(body.date),
        location: body.location || null,
        seat: body.seat || null,
        type: body.type || '期中考试',
        remindDays: body.remindDays || 3,
      },
    });
    return NextResponse.json(exam);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const exam = await db.exam.update({
      where: { id: body.id },
      data: {
        title: body.title,
        courseId: body.courseId,
        date: new Date(body.date),
        location: body.location,
        seat: body.seat,
        type: body.type,
        remindDays: body.remindDays,
      },
    });
    return NextResponse.json(exam);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update exam' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    await db.exam.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 });
  }
}
