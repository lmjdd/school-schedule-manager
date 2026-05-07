import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const grades = await db.grade.findMany({
      include: { course: true },
      orderBy: { semester: 'desc' },
    });
    return NextResponse.json(grades);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const grade = await db.grade.create({
      data: {
        courseId: body.courseId,
        semester: body.semester || '2024-2025-2',
        score: body.score ?? null,
        gradePoint: body.gradePoint ?? null,
        credit: body.credit || 0,
      },
    });
    return NextResponse.json(grade);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create grade' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const grade = await db.grade.update({
      where: { id: body.id },
      data: {
        courseId: body.courseId,
        semester: body.semester,
        score: body.score,
        gradePoint: body.gradePoint,
        credit: body.credit,
      },
    });
    return NextResponse.json(grade);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update grade' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    await db.grade.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete grade' }, { status: 500 });
  }
}
