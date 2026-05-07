import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const courses = await db.course.findMany();
    const assignments = await db.assignment.findMany({ include: { course: true } });
    const exams = await db.exam.findMany({ include: { course: true } });
    const grades = await db.grade.findMany({ include: { course: true } });
    return NextResponse.json({ courses, assignments, exams, grades });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courses, assignments, exams, grades } = body;

    // Clear existing data
    await db.grade.deleteMany();
    await db.exam.deleteMany();
    await db.assignment.deleteMany();
    await db.course.deleteMany();

    // Import courses
    if (courses && courses.length > 0) {
      for (const course of courses) {
        await db.course.create({
          data: {
            name: course.name,
            teacher: course.teacher,
            location: course.location,
            credit: course.credit,
            category: course.category,
            color: course.color,
            dayOfWeek: course.dayOfWeek,
            startTime: course.startTime,
            endTime: course.endTime,
            startWeek: course.startWeek,
            endWeek: course.endWeek,
            semester: course.semester,
          },
        });
      }
    }

    // Import assignments
    if (assignments && assignments.length > 0) {
      for (const a of assignments) {
        await db.assignment.create({
          data: {
            title: a.title,
            courseId: a.courseId,
            description: a.description,
            dueDate: a.dueDate ? new Date(a.dueDate) : null,
            status: a.status,
            priority: a.priority,
            remindDays: a.remindDays,
          },
        });
      }
    }

    // Import exams
    if (exams && exams.length > 0) {
      for (const e of exams) {
        await db.exam.create({
          data: {
            title: e.title,
            courseId: e.courseId,
            date: new Date(e.date),
            location: e.location,
            seat: e.seat,
            type: e.type,
            remindDays: e.remindDays,
          },
        });
      }
    }

    // Import grades
    if (grades && grades.length > 0) {
      for (const g of grades) {
        await db.grade.create({
          data: {
            courseId: g.courseId,
            semester: g.semester,
            score: g.score,
            gradePoint: g.gradePoint,
            credit: g.credit,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}
