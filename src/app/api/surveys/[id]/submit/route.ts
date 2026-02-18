import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/surveys/[id]/submit - Submit a response
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { respondentName, respondentEmail, answers } = body;

    // Verify survey exists
    const survey = await db.survey.findUnique({
      where: { id },
      include: {
        segments: {
          include: { questions: true },
        },
      },
    });

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Create response with answers
    const response = await db.response.create({
      data: {
        surveyId: id,
        respondentName,
        respondentEmail,
        answers: {
          create: answers.map((answer: { questionId: string; rating: number }) => ({
            questionId: answer.questionId,
            rating: answer.rating,
          })),
        },
      },
      include: {
        answers: true,
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 });
  }
}
