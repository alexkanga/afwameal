import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/surveys/[id]/responses - Get all responses for a survey
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const responses = await db.response.findMany({
      where: { surveyId: id },
      include: {
        answers: {
          include: {
            question: {
              include: {
                segment: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
}
