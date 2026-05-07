import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    const counts: Record<string, number> = { courses: 0, assignments: 0, exams: 0, grades: 0, notes: 0, subtasks: 0, attendance: 0 };

    // Check if data already exists
    const existingCourses = await db.course.count();
    let courses: Awaited<ReturnType<typeof db.course.findMany>>;

    if (existingCourses > 0) {
      courses = await db.course.findMany();
      counts.courses = courses.length;
    } else {
      // Seed courses
      courses = await Promise.all([
        db.course.create({ data: { name: '高等数学 A', teacher: '张明教授', location: '教一楼301', credit: 4, category: '必修', color: '#ef4444', dayOfWeek: 1, startTime: '08:00', endTime: '09:40', startWeek: 1, endWeek: 16, semester: '2024-2025-2' } }),
        db.course.create({ data: { name: '大学英语 III', teacher: '李华', location: '外语楼205', credit: 3, category: '必修', color: '#3b82f6', dayOfWeek: 2, startTime: '10:00', endTime: '11:40', startWeek: 1, endWeek: 16, semester: '2024-2025-2' } }),
        db.course.create({ data: { name: '数据结构与算法', teacher: '王强', location: '计算机楼102', credit: 3, category: '必修', color: '#10b981', dayOfWeek: 3, startTime: '08:00', endTime: '09:40', startWeek: 1, endWeek: 16, semester: '2024-2025-2' } }),
        db.course.create({ data: { name: '线性代数', teacher: '赵雪', location: '教二楼505', credit: 3, category: '必修', color: '#f59e0b', dayOfWeek: 4, startTime: '14:00', endTime: '15:40', startWeek: 1, endWeek: 16, semester: '2024-2025-2' } }),
        db.course.create({ data: { name: '大学物理 B', teacher: '刘伟', location: '物理楼201', credit: 3, category: '必修', color: '#8b5cf6', dayOfWeek: 1, startTime: '14:00', endTime: '15:40', startWeek: 1, endWeek: 16, semester: '2024-2025-2' } }),
        db.course.create({ data: { name: '体育（羽毛球）', teacher: '陈教练', location: '体育馆B区', credit: 1, category: '必修', color: '#ec4899', dayOfWeek: 5, startTime: '08:00', endTime: '09:40', startWeek: 1, endWeek: 16, semester: '2024-2025-2' } }),
        db.course.create({ data: { name: '中国近现代史纲要', teacher: '孙丽', location: '教三楼801', credit: 2, category: '通识', color: '#06b6d4', dayOfWeek: 2, startTime: '14:00', endTime: '15:40', startWeek: 1, endWeek: 14, semester: '2024-2025-2' } }),
        db.course.create({ data: { name: 'Python 程序设计', teacher: '周磊', location: '计算机楼301', credit: 2, category: '选修', color: '#f97316', dayOfWeek: 5, startTime: '14:00', endTime: '15:40', startWeek: 1, endWeek: 16, semester: '2024-2025-2' } }),
      ]);
      counts.courses = courses.length;

      // Seed assignments
      const now = new Date();
      const day = 24 * 60 * 60 * 1000;
      const assignments = await Promise.all([
        db.assignment.create({ data: { title: '高数第三章习题', courseId: courses[0].id, description: '完成教材P120-P125的所有习题', dueDate: new Date(now.getTime() + 2 * day), status: 'pending', priority: 2, remindDays: 1 } }),
        db.assignment.create({ data: { title: '英语阅读报告', courseId: courses[1].id, description: '阅读指定文章并撰写500字读书笔记', dueDate: new Date(now.getTime() + 5 * day), status: 'in_progress', priority: 1, remindDays: 1 } }),
        db.assignment.create({ data: { title: '数据结构实验报告', courseId: courses[2].id, description: '实现二叉搜索树的插入、删除和查找操作', dueDate: new Date(now.getTime() + 7 * day), status: 'pending', priority: 3, remindDays: 2 } }),
        db.assignment.create({ data: { title: '线性代数作业五', courseId: courses[3].id, description: '矩阵运算综合练习', dueDate: new Date(now.getTime() + 1 * day), status: 'pending', priority: 2, remindDays: 1 } }),
        db.assignment.create({ data: { title: '物理实验预习报告', courseId: courses[4].id, description: '预习光的干涉与衍射实验', dueDate: new Date(now.getTime() - 1 * day), status: 'overdue', priority: 1, remindDays: 1 } }),
        db.assignment.create({ data: { title: 'Python 课程项目', courseId: courses[7].id, description: '开发一个简单的学生成绩管理系统', dueDate: new Date(now.getTime() + 14 * day), status: 'pending', priority: 3, remindDays: 3 } }),
      ]);
      counts.assignments = assignments.length;

      // Seed exams
      const exams = await Promise.all([
        db.exam.create({ data: { title: '高等数学期中考试', courseId: courses[0].id, date: new Date(now.getTime() + 21 * day), location: '教一楼301', seat: 'A15', type: '期中考试', remindDays: 7 } }),
        db.exam.create({ data: { title: '数据结构期中考试', courseId: courses[2].id, date: new Date(now.getTime() + 25 * day), location: '计算机楼102', seat: 'B22', type: '期中考试', remindDays: 7 } }),
        db.exam.create({ data: { title: '大学英语四级模拟', courseId: courses[1].id, date: new Date(now.getTime() + 35 * day), location: '外语楼305', seat: null, type: '模拟考试', remindDays: 3 } }),
        db.exam.create({ data: { title: '线性代数随堂测验', courseId: courses[3].id, date: new Date(now.getTime() + 10 * day), location: '教二楼505', seat: null, type: '随堂测验', remindDays: 1 } }),
      ]);
      counts.exams = exams.length;

      // Seed grades (previous semester)
      const prevSemester = '2024-2025-1';
      const prevGrades = await Promise.all([
        db.grade.create({ data: { courseId: courses[0].id, semester: prevSemester, score: 88, gradePoint: 3.3, credit: 4 } }),
        db.grade.create({ data: { courseId: courses[1].id, semester: prevSemester, score: 92, gradePoint: 3.9, credit: 3 } }),
        db.grade.create({ data: { courseId: courses[2].id, semester: prevSemester, score: 95, gradePoint: 4.0, credit: 3 } }),
        db.grade.create({ data: { courseId: courses[4].id, semester: prevSemester, score: 78, gradePoint: 2.3, credit: 3 } }),
        db.grade.create({ data: { courseId: courses[5].id, semester: prevSemester, score: 85, gradePoint: 3.3, credit: 1 } }),
        db.grade.create({ data: { courseId: courses[6].id, semester: prevSemester, score: 90, gradePoint: 3.7, credit: 2 } }),
      ]);
      counts.grades += prevGrades.length;

      // Some grades from two semesters ago
      const oldSemester = '2023-2024-2';
      const oldGrades = await Promise.all([
        db.grade.create({ data: { courseId: courses[0].id, semester: oldSemester, score: 82, gradePoint: 2.7, credit: 4 } }),
        db.grade.create({ data: { courseId: courses[1].id, semester: oldSemester, score: 87, gradePoint: 3.3, credit: 3 } }),
        db.grade.create({ data: { courseId: courses[3].id, semester: oldSemester, score: 91, gradePoint: 3.7, credit: 3 } }),
        db.grade.create({ data: { courseId: courses[4].id, semester: oldSemester, score: 75, gradePoint: 2.3, credit: 3 } }),
      ]);
      counts.grades += oldGrades.length;
    }

    // Seed subtasks for assignments (always check, in case added after initial seed)
    // Safety: db.subtask may be undefined if Prisma client hasn't been regenerated in the running server
    const existingSubtasks = (db as Record<string, unknown>).subtask
      ? await db.subtask.count()
      : -1;
    if (existingSubtasks === 0) {
      const allAssignments = await db.assignment.findMany();
      if (allAssignments.length > 0) {
        const subtaskData: { assignmentId: string; title: string; isCompleted: boolean; order: number }[] = [];

        for (const a of allAssignments) {
          if (a.title.includes('高数第三章')) {
            subtaskData.push(
              { assignmentId: a.id, title: '完成极限与连续习题 (P120-122)', isCompleted: true, order: 0 },
              { assignmentId: a.id, title: '完成导数与微分习题 (P122-125)', isCompleted: false, order: 1 },
              { assignmentId: a.id, title: '整理错题本', isCompleted: false, order: 2 },
            );
          } else if (a.title.includes('英语阅读报告')) {
            subtaskData.push(
              { assignmentId: a.id, title: '阅读指定文章 (至少3篇)', isCompleted: true, order: 0 },
              { assignmentId: a.id, title: '摘录关键观点和词汇', isCompleted: true, order: 1 },
              { assignmentId: a.id, title: '撰写初稿 (500字)', isCompleted: false, order: 2 },
              { assignmentId: a.id, title: '修改润色并提交', isCompleted: false, order: 3 },
            );
          } else if (a.title.includes('数据结构实验报告')) {
            subtaskData.push(
              { assignmentId: a.id, title: '复习二叉搜索树原理', isCompleted: true, order: 0 },
              { assignmentId: a.id, title: '实现插入操作', isCompleted: true, order: 1 },
              { assignmentId: a.id, title: '实现删除操作', isCompleted: false, order: 2 },
              { assignmentId: a.id, title: '实现查找操作', isCompleted: false, order: 3 },
              { assignmentId: a.id, title: '编写测试用例', isCompleted: false, order: 4 },
            );
          } else if (a.title.includes('线性代数作业五')) {
            subtaskData.push(
              { assignmentId: a.id, title: '完成矩阵乘法练习', isCompleted: true, order: 0 },
              { assignmentId: a.id, title: '完成逆矩阵计算', isCompleted: false, order: 1 },
              { assignmentId: a.id, title: '完成行列式练习', isCompleted: false, order: 2 },
            );
          } else if (a.title.includes('物理实验预习报告')) {
            subtaskData.push(
              { assignmentId: a.id, title: '阅读实验指导书', isCompleted: true, order: 0 },
              { assignmentId: a.id, title: '了解干涉与衍射原理', isCompleted: false, order: 1 },
              { assignmentId: a.id, title: '准备预习报告模板', isCompleted: false, order: 2 },
            );
          } else if (a.title.includes('Python 课程项目')) {
            subtaskData.push(
              { assignmentId: a.id, title: '需求分析与功能设计', isCompleted: true, order: 0 },
              { assignmentId: a.id, title: '数据库设计', isCompleted: true, order: 1 },
              { assignmentId: a.id, title: '开发用户界面', isCompleted: false, order: 2 },
              { assignmentId: a.id, title: '实现后端逻辑', isCompleted: false, order: 3 },
              { assignmentId: a.id, title: '测试与部署', isCompleted: false, order: 4 },
            );
          }
        }

        if (subtaskData.length > 0) {
          await Promise.all(
            subtaskData.map((s) => db.subtask.create({ data: s })),
          );
          counts.subtasks = subtaskData.length;
        }
      }
    } else {
      counts.subtasks = existingSubtasks;
    }

    // Seed notes (always check, in case notes were added to schema after initial seed)
    const existingNotes = await db.note.count();
    if (existingNotes === 0 && courses.length > 0) {
      const notes = await Promise.all([
        db.note.create({ data: { title: '高等数学极限与连续', content: '函数极限的定义：设函数f(x)在x₀的某去心邻域内有定义，如果存在常数A，对于任意给定的正数ε，总存在正数δ，使得当0<|x-x₀|<δ时，都有|f(x)-A|<ε，那么A就叫做函数f(x)当x→x₀时的极限。\n\n重要性质：\n- 唯一性：如果极限存在，则极限值唯一\n- 局部有界性：如果极限存在，则函数在该点附近有界\n- 保号性：极限为正（负），则函数在该点附近也为正（负）', courseId: courses[0].id, tag: '重点', isPinned: true } }),
        db.note.create({ data: { title: '英语写作常用句型', content: '开头段：\n- With the rapid development of..., ...has become increasingly important.\n- There is a growing awareness that...\n- It is widely acknowledged that...\n\n结尾段：\n- In conclusion, based on the above analysis, we can draw the conclusion that...\n- Taking all these factors into consideration, I believe that...\n- Only in this way can we...\n\n转折句型：\n- However, every coin has two sides.\n- On the contrary, some people argue that...', courseId: courses[1].id, tag: '复习', isPinned: false } }),
        db.note.create({ data: { title: '数据结构 - 二叉树遍历', content: '前序遍历（Pre-order）：根 → 左 → 右\n递归实现：\nvoid preOrder(TreeNode* root) {\n  if (root == null) return;\n  visit(root);\n  preOrder(root.left);\n  preOrder(root.right);\n}\n\n中序遍历（In-order）：左 → 根 → 右\n后序遍历（Post-order）：左 → 右 → 根\n层序遍历（Level-order）：使用队列实现\n\n时间复杂度均为 O(n)，空间复杂度 O(h)，h 为树高。', courseId: courses[2].id, tag: '笔记', isPinned: true } }),
        db.note.create({ data: { title: '线性代数矩阵运算公式', content: '矩阵乘法：\n(AB)ᵢⱼ = Σₖ aᵢₖbₖⱼ\n\n转置性质：\n(Aᵀ)ᵀ = A\n(A+B)ᵀ = Aᵀ + Bᵀ\n(AB)ᵀ = BᵀAᵀ\n\n逆矩阵：\nAA⁻¹ = A⁻¹A = I\n(AB)⁻¹ = B⁻¹A⁻¹\n\n行列式性质：\ndet(AB) = det(A)·det(B)\ndet(Aᵀ) = det(A)\ndet(A⁻¹) = 1/det(A)', courseId: courses[3].id, tag: '公式', isPinned: false } }),
        db.note.create({ data: { title: '大学物理光学公式汇总', content: '光的干涉：\n光程差 δ = d·sinθ\n明条纹：δ = ±kλ（k=0,1,2,...）\n暗条纹：δ = ±(k+½)λ\n\n杨氏双缝：\nΔx = λL/d（条纹间距）\n\n薄膜干涉：\n反射光程差：δ = 2nd + λ/2（n为折射率，有半波损失）\n\n光的衍射：\n单缝衍射暗纹：a·sinθ = ±kλ（k=1,2,3,...）', courseId: courses[4].id, tag: '公式', isPinned: false } }),
      ]);
      counts.notes = notes.length;
    } else {
      counts.notes = existingNotes;
    }

    // Seed attendance records (always check, in case added after initial seed)
    const existingAttendance = await db.attendance.count();
    if (existingAttendance === 0 && courses.length > 0) {
      const now = new Date();
      const day = 24 * 60 * 60 * 1000;

      // Generate dates for the past ~3 weeks, skipping weekends
      const statuses: Array<'present' | 'absent' | 'late' | 'leave'> = ['present', 'present', 'present', 'present', 'present', 'present', 'present', 'late', 'late', 'absent', 'leave'];
      const attendanceData: Array<{ courseId: string; date: string; status: 'present' | 'absent' | 'late' | 'leave'; note?: string }> = [];

      // Course day-of-week mapping (1=Mon...7=Sun, matching schema)
      const courseDays: Array<{ courseId: string; dow: number }> = [
        { courseId: courses[0].id, dow: 1 }, // 高等数学 - Monday
        { courseId: courses[1].id, dow: 2 }, // 大学英语 - Tuesday
        { courseId: courses[2].id, dow: 3 }, // 数据结构 - Wednesday
        { courseId: courses[3].id, dow: 4 }, // 线性代数 - Thursday
        { courseId: courses[4].id, dow: 1 }, // 大学物理 - Monday
        { courseId: courses[5].id, dow: 5 }, // 体育 - Friday
        { courseId: courses[6].id, dow: 2 }, // 近现代史 - Tuesday
        { courseId: courses[7].id, dow: 5 }, // Python - Friday
      ];

      for (let daysAgo = 1; daysAgo <= 21; daysAgo++) {
        const d = new Date(now.getTime() - daysAgo * day);
        const dow = d.getDay() === 0 ? 7 : d.getDay(); // Sun=0 -> 7
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        for (const cd of courseDays) {
          if (cd.dow === dow) {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const note = status === 'leave' ? '身体不适，已请假' : status === 'absent' ? '闹钟没响' : status === 'late' ? '公交延误' : undefined;
            attendanceData.push({ courseId: cd.courseId, date: dateStr, status, note });
          }
        }
      }

      if (attendanceData.length > 0) {
        // Create in batches to avoid overwhelming the database
        const batchSize = 50;
        for (let i = 0; i < attendanceData.length; i += batchSize) {
          const batch = attendanceData.slice(i, i + batchSize);
          await Promise.all(batch.map((a) => db.attendance.create({ data: a })));
        }
        counts.attendance = attendanceData.length;
      }
    } else {
      counts.attendance = existingAttendance;
    }

    return NextResponse.json({
      success: true,
      message: existingCourses > 0 ? '笔记数据已补充填充' : '示例数据已填充',
      counts
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: '填充失败' }, { status: 500 });
  }
}
