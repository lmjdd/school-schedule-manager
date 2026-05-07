import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/notes?courseId=xxx&tag=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const tag = searchParams.get('tag');

    const notes = await db.note.findMany({
      where: {
        ...(courseId ? { courseId } : {}),
        ...(tag ? { tag } : {}),
      },
      include: {
        course: true,
      },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return NextResponse.json({ error: '获取笔记失败' }, { status: 500 });
  }
}

// POST /api/notes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, courseId, tag } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }

    const note = await db.note.create({
      data: {
        title: title.trim(),
        content: content?.trim() || '',
        courseId: courseId || null,
        tag: tag || null,
      },
      include: {
        course: true,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Failed to create note:', error);
    return NextResponse.json({ error: '创建笔记失败' }, { status: 500 });
  }
}

// PUT /api/notes
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, courseId, tag, isPinned } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少笔记 ID' }, { status: 400 });
    }

    const note = await db.note.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(content !== undefined ? { content: content.trim() } : {}),
        ...(courseId !== undefined ? { courseId: courseId || null } : {}),
        ...(tag !== undefined ? { tag: tag || null } : {}),
        ...(isPinned !== undefined ? { isPinned: Boolean(isPinned) } : {}),
      },
      include: {
        course: true,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Failed to update note:', error);
    return NextResponse.json({ error: '更新笔记失败' }, { status: 500 });
  }
}

// DELETE /api/notes?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少笔记 ID' }, { status: 400 });
    }

    await db.note.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete note:', error);
    return NextResponse.json({ error: '删除笔记失败' }, { status: 500 });
  }
}
