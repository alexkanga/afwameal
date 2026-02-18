import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/surveys/[id]/analytics - Get analytics data for a survey
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get survey with all responses and answers
    const survey = await db.survey.findUnique({
      where: { id },
      include: {
        segments: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: {
                answers: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        responses: true,
      },
    });

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Calculate analytics
    const totalResponses = survey.responses.length;
    
    // Analytics by segment
    const segmentAnalytics = survey.segments.map(segment => {
      const questionAnalytics = segment.questions.map(question => {
        const ratings = question.answers.map(a => a.rating);
        const avg = ratings.length > 0 
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
          : 0;
        
        // Distribution
        const distribution = {
          1: ratings.filter(r => r === 1).length,
          2: ratings.filter(r => r === 2).length,
          3: ratings.filter(r => r === 3).length,
          4: ratings.filter(r => r === 4).length,
          5: ratings.filter(r => r === 5).length,
        };

        return {
          questionId: question.id,
          questionText: question.text,
          averageRating: Math.round(avg * 100) / 100,
          totalAnswers: ratings.length,
          distribution,
        };
      });

      // Segment average
      const allRatings = segment.questions.flatMap(q => q.answers.map(a => a.rating));
      const segmentAvg = allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
        : 0;

      return {
        segmentId: segment.id,
        segmentTitle: segment.title,
        averageRating: Math.round(segmentAvg * 100) / 100,
        questionAnalytics,
      };
    });

    // Overall average
    const allRatings = survey.segments.flatMap(s => 
      s.questions.flatMap(q => q.answers.map(a => a.rating))
    );
    const overallAverage = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
      : 0;

    // Rating distribution overall
    const overallDistribution = {
      1: allRatings.filter(r => r === 1).length,
      2: allRatings.filter(r => r === 2).length,
      3: allRatings.filter(r => r === 3).length,
      4: allRatings.filter(r => r === 4).length,
      5: allRatings.filter(r => r === 5).length,
    };

    // Responses over time (by day)
    const responsesByDate = survey.responses.reduce((acc, response) => {
      const date = new Date(response.submittedAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const responseData = Object.entries(responsesByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      surveyId: id,
      surveyTitle: survey.title,
      totalResponses,
      overallAverage: Math.round(overallAverage * 100) / 100,
      overallDistribution,
      segmentAnalytics,
      responseData,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
