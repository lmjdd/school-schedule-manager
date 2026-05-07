import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { image, type } = await request.json();

    if (!image) {
      return NextResponse.json({ error: '请提供截图' }, { status: 400 });
    }

    const zai = await ZAI.create();

    let prompt = '';
    if (type === 'schedule') {
      prompt = `请识别这张课表截图中的所有课程信息，并以JSON格式返回。返回格式如下：
{
  "type": "schedule",
  "courses": [
    {
      "name": "课程名称",
      "teacher": "教师姓名",
      "location": "上课地点",
      "dayOfWeek": 1-7（周一为1，周日为7）,
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "startWeek": 1,
      "endWeek": 16,
      "credit": 3
    }
  ]
}
请只返回JSON数据，不要包含其他文字。如果无法识别某些字段，使用null。`;
    } else if (type === 'grades') {
      prompt = `请识别这张成绩单截图中的所有成绩信息，并以JSON格式返回。返回格式如下：
{
  "type": "grades",
  "semester": "2024-2025-2",
  "grades": [
    {
      "courseName": "课程名称",
      "credit": 3,
      "score": 95,
      "gradePoint": 4.0
    }
  ]
}
请只返回JSON数据，不要包含其他文字。如果无法识别某些字段，使用null。绩点请按照中国大学标准：90-100为4.0，85-89为3.7，82-84为3.3，78-81为3.0，75-77为2.7，72-74为2.3，68-71为2.0，64-67为1.5，60-63为1.0，60以下为0。`;
    } else {
      prompt = `请识别这张教务系统截图中的信息，判断它是课表还是成绩单，并提取所有可用信息。以JSON格式返回。
如果是课表：
{"type": "schedule", "courses": [{"name": "", "teacher": "", "location": "", "dayOfWeek": 1, "startTime": "", "endTime": "", "startWeek": 1, "endWeek": 16, "credit": 0}]}
如果是成绩单：
{"type": "grades", "semester": "", "grades": [{"courseName": "", "credit": 0, "score": 0, "gradePoint": 0}]}
请只返回JSON数据。`;
    }

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Try to extract JSON from the response
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ success: true, data: parsed });
      } catch {
        // If JSON parsing fails, return raw content
      }
    }

    return NextResponse.json({ success: true, data: content, raw: true });
  } catch (error: any) {
    console.error('Recognition error:', error);
    return NextResponse.json(
      { error: '识别失败：' + (error.message || '未知错误') },
      { status: 500 }
    );
  }
}
