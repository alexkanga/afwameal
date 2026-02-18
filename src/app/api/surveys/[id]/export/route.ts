import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { db } from '@/lib/db';

// GET /api/surveys/[id]/export - Export responses to Excel
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get survey with all data
    const survey = await db.survey.findUnique({
      where: { id },
      include: {
        segments: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        responses: {
          include: {
            answers: {
              include: {
                question: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Build header row
    const headers = ['#', 'Nom', 'Email', 'Date de soumission'];
    
    // Add question headers with segment prefix
    const questionMap = new Map<string, { questionText: string; segmentTitle: string }>();
    survey.segments.forEach(segment => {
      segment.questions.forEach(question => {
        questionMap.set(question.id, {
          questionText: question.text,
          segmentTitle: segment.title,
        });
        headers.push(`${segment.title.substring(0, 3).toUpperCase()} - Q${question.order + 1}`);
      });
    });

    // Build data rows
    const rows = survey.responses.map((response, index) => {
      const row: (string | number)[] = [
        index + 1,
        response.respondentName || 'Anonyme',
        response.respondentEmail || '-',
        new Date(response.submittedAt).toLocaleString('fr-FR'),
      ];

      // Add answers in order
      survey.segments.forEach(segment => {
        segment.questions.forEach(question => {
          const answer = response.answers.find(a => a.questionId === question.id);
          row.push(answer ? answer.rating : '-');
        });
      });

      return row;
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Main data sheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map((_, i) => ({ wch: i < 4 ? 25 : 10 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Réponses');

    // Create summary sheet with question mapping
    const summaryHeaders = ['Segment', 'Question N°', 'Question'];
    const summaryRows = survey.segments.flatMap(segment =>
      segment.questions.map((question, qIndex) => [
        segment.title,
        `Q${qIndex + 1}`,
        question.text,
      ])
    );
    const summaryWs = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
    summaryWs['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Questions');

    // Analytics summary sheet
    const analyticsHeaders = ['Segment', 'Question', 'Moyenne', '1', '2', '3', '4', '5'];
    const analyticsRows: (string | number)[][] = [];
    
    survey.segments.forEach(segment => {
      segment.questions.forEach(question => {
        const ratings = survey.responses
          .map(r => r.answers.find(a => a.questionId === question.id)?.rating)
          .filter((r): r is number => r !== undefined);
        
        const avg = ratings.length > 0 
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
          : 0;
        
        analyticsRows.push([
          segment.title,
          `Q${question.order + 1}`,
          Math.round(avg * 100) / 100,
          ratings.filter(r => r === 1).length,
          ratings.filter(r => r === 2).length,
          ratings.filter(r => r === 3).length,
          ratings.filter(r => r === 4).length,
          ratings.filter(r => r === 5).length,
        ]);
      });
    });
    
    const analyticsWs = XLSX.utils.aoa_to_sheet([analyticsHeaders, ...analyticsRows]);
    analyticsWs['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, analyticsWs, 'Analyse');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="survey-${id}-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting survey:', error);
    return NextResponse.json({ error: 'Failed to export survey' }, { status: 500 });
  }
}
