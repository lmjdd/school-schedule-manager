import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
    }

    const subtasks = await db.subtask.findMany({
      where: { assignmentId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(subtasks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subtasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignmentId, title, order } = body;

    if (!assignmentId || !title?.trim()) {
      return NextResponse.json({ error: 'assignmentId and title are required' }, { status: 400 });
    }

    // Get the next order value if not provided
    let nextOrder = order;
    if (nextOrder === undefined || nextOrder === null) {
      const maxOrder = await db.subtask.findFirst({
        where: { assignmentId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      nextOrder = (maxOrder?.order ?? -1) + 1;
    }

    const subtask = await db.subtask.create({
      data: {
        assignmentId,
        title: title.trim(),
        order: nextOrder,
      },
    });

    return NextResponse.json(subtask);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create subtask' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.isCompleted !== undefined) updateData.isCompleted = body.isCompleted;
    if (body.order !== undefined) updateData.order = body.order;

    const subtask = await db.subtask.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(subtask);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await db.subtask.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 });
  }
}
