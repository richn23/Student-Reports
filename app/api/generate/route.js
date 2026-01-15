import { NextResponse } from 'next/server';

// Level-specific language constraints
const LEVEL_CONSTRAINTS = {
  'beginner': {
    cefr: 'A1',
    language: 'Short, simple sentences. Present tense. Basic vocabulary only. Maximum 8 words per sentence.'
  },
  'elementary': {
    cefr: 'A2',
    language: 'Short sentences. Present and past simple. Simple vocabulary. Maximum 10 words per sentence.'
  },
  'pre-intermediate': {
    cefr: 'A2+',
    language: 'Clear explanations. Concrete classroom references. Maximum 12 words per sentence.'
  },
  'intermediate': {
    cefr: 'B1',
    language: 'Clear explanations. Can reference skills directly. Maximum 15 words per sentence.'
  },
  'upper-intermediate': {
    cefr: 'B2',
    language: 'More precise vocabulary. Still classroom-focused. Maximum 18 words per sentence.'
  },
  'advanced': {
    cefr: 'C1',
    language: 'Precise vocabulary. Classroom-focused. No academic or scholarly register. Maximum 20 words per sentence.'
  }
};

const SYSTEM_PROMPT = `You are an experienced English teacher writing short classroom feedback for students.

The feedback is:
- Written for the student to read
- Based only on classroom behaviour and language use
- Not a personality or character judgement

STRICT RULES:
- Do NOT analyse personality, motivation, confidence, or attitudes
- Do NOT use academic, counselling, or coaching language
- Do NOT exaggerate or reinterpret the inputs
- Treat all weaknesses as classroom behaviours
- Do NOT comment on appearance, clothing, or personal habits
- The Extra field may only be used if it relates to classroom learning, participation, or interaction

PURPOSE:
- Acknowledge strengths (if provided)
- Identify areas to improve (if provided)
- Give clear, practical next steps (if provided)
- Add relevant context (only if Extra relates to learning)

STRUCTURE & LENGTH:
- 4-5 sentences total
- Maximum 20 words per sentence
- Each input field (Strength, Weakness, Suggestion, Extra) may generate 0-2 sentences
- If an input field is empty, skip it completely
- Use plain teacher language

TONE:
- Calm, fair, and direct
- Supportive without being emotional
- Professional classroom voice
- No emojis
- No exclamation marks
- No generic praise ("great job", "well done") unless supported by evidence

FORMAT:
- Start with the student's name, then a comma
- No greeting ("Dear...")
- No sign-off`;

export async function POST(request) {
  try {
    const { students, classLevel } = await request.json();
    
    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'No students provided' }, { status: 400 });
    }

    if (students.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 students allowed' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const levelConfig = LEVEL_CONSTRAINTS[classLevel] || LEVEL_CONSTRAINTS['pre-intermediate'];
    const reports = [];

    for (const student of students) {
      if (!student.name || !student.name.trim()) {
        continue;
      }

      const prompt = buildPrompt(student, levelConfig, classLevel);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API error:', errorData);
        reports.push({
          name: student.name,
          report: 'Error generating report. Please try again.',
          error: true
        });
        continue;
      }

      const data = await response.json();
      const reportText = data.content[0]?.text || 'Error generating report.';

      reports.push({
        name: student.name.trim(),
        report: reportText.trim()
      });
    }

    return NextResponse.json({ reports });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function buildPrompt(student, config, levelName) {
  const parts = [];

  parts.push(`STUDENT: ${student.name.trim()}`);
  parts.push(`LEVEL: ${levelName} (CEFR ${config.cefr})`);
  parts.push(`LANGUAGE FOR THIS LEVEL: ${config.language}`);
  parts.push('');
  parts.push('INPUT DATA:');
  
  // Only include non-empty fields
  if (student.good?.trim()) {
    parts.push(`Strength: ${student.good.trim()}`);
  }
  if (student.bad?.trim()) {
    parts.push(`Weakness: ${student.bad.trim()}`);
  }
  if (student.suggestion?.trim()) {
    parts.push(`Suggestion: ${student.suggestion.trim()}`);
  }
  if (student.extra?.trim()) {
    parts.push(`Extra: ${student.extra.trim()}`);
  }
  
  parts.push('');
  parts.push('Write the feedback now. 4-5 sentences total. Skip empty fields.');

  return parts.join('\n');
}