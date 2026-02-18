import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/surveys - List all surveys
export async function GET() {
  try {
    const surveys = await db.survey.findMany({
      include: {
        segments: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { responses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(surveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
  }
}

// POST /api/surveys - Create a new survey
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, segments } = body;

    const survey = await db.survey.create({
      data: {
        title,
        description,
        segments: {
          create: segments.map((segment: { title: string; questions: { text: string; ratingLabels?: string }[] }, segmentIndex: number) => ({
            title: segment.title,
            order: segmentIndex,
            questions: {
              create: segment.questions.map((question: { text: string; ratingLabels?: string }, questionIndex: number) => ({
                text: question.text,
                order: questionIndex,
                ratingLabels: question.ratingLabels || null,
              })),
            },
          })),
        },
      },
      include: {
        segments: {
          include: { questions: true },
        },
      },
    });

    return NextResponse.json(survey, { status: 201 });
  } catch (error) {
    console.error('Error creating survey:', error);
    return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
  }
}
