import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let assignments;
    try {
      // Try with subtasks included (works with updated Prisma client)
      assignments = await db.assignment.findMany({
        include: {
          course: true,
          subtasks: { orderBy: { order: 'asc' } },
        },
        orderBy: { dueDate: 'asc' },
      });
    } catch {
      // Fallback for stale Prisma client (without subtasks model)
      assignments = await db.assignment.findMany({
        include: { course: true },
        orderBy: { dueDate: 'asc' },
      });
    }

    // Check and mark overdue assignments
    const now = new Date();
    const updated = assignments.map((a) => {
      if (a.dueDate && new Date(a.dueDate) < now && a.status === 'pending') {
        return { ...a, status: 'overdue' as const };
      }
      return a;
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const assignment = await db.assignment.create({
      data: {
        title: body.title,
        courseId: body.courseId,
        description: body.description || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: body.status || 'pending',
        priority: body.priority || 0,
        remindDays: body.remindDays || 1,
      },
    });
    return NextResponse.json(assignment);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const assignment = await db.assignment.update({
      where: { id: body.id },
      data: {
        title: body.title,
        courseId: body.courseId,
        description: body.description,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: body.status,
        priority: body.priority,
        remindDays: body.remindDays,
      },
    });
    return NextResponse.json(assignment);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    await db.assignment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
