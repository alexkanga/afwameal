import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default MEAL survey (Congress evaluation - 20 questions)
const mealSurvey = {
  title: "Enquête d'Évaluation - Congrès",
  description: "Questionnaire d'évaluation de satisfaction pour les participants",
  segments: [
    {
      title: "SEGMENT 1 : ORGANISATION GÉNÉRALE",
      questions: [
        { text: "Comment évaluez-vous la qualité globale de l'organisation logistique (accueil, orientation, gestion des flux) ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Comment jugez-vous la ponctualité et le respect du programme officiel ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Comment évaluez-vous la qualité de la communication avant et pendant l'événement (emails, site web, signalétique, application mobile) ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Comment évaluez-vous les conditions matérielles (salles, sonorisation, climatisation, confort) ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Comment jugez-vous la coordination générale et la réactivité de l'équipe organisatrice ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
      ],
    },
    {
      title: "SEGMENT 2 : SCIENTIFIQUE",
      questions: [
        { text: "Comment évaluez-vous la pertinence des thématiques abordées par rapport aux enjeux actuels du secteur ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Comment jugez-vous la qualité scientifique des communications présentées ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Comment évaluez-vous la diversité et le niveau d'expertise des intervenants ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Comment jugez-vous l'équilibre entre théorie, innovation et applicabilité opérationnelle ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Comment évaluez-vous la valeur ajoutée scientifique globale du congrès pour votre institution ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
      ],
    },
    {
      title: "SEGMENT 3 : EXPOSITION",
      questions: [
        { text: "Comment évaluez-vous la diversité et la qualité des exposants présents ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Comment jugez-vous l'organisation de l'espace d'exposition (circulation, visibilité, accessibilité) ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Comment évaluez-vous l'intérêt des solutions et innovations présentées ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Comment jugez-vous les opportunités de networking avec les exposants ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Comment évaluez-vous la contribution de l'exposition à la dynamique globale de l'événement ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
      ],
    },
    {
      title: "SEGMENT 4 : AUTRE (IMPACT & PERSPECTIVES)",
      questions: [
        { text: "Comment évaluez-vous les opportunités de partenariats générées par cet événement ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Comment jugez-vous l'impact potentiel des recommandations issues des sessions ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Comment évaluez-vous la qualité des moments de réseautage (forums, rencontres B2B, pauses stratégiques) ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Comment jugez-vous la représentativité institutionnelle et géographique des participants ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
        { text: "Recommanderiez-vous cet événement à vos partenaires et collègues ?", ratingLabels: ["Très insuffisant", "Insuffisant", "Satisfaisant", "Très satisfaisant", "Excellent"] },
      ],
    },
  ],
};

// Event Evaluation Survey (10 questions with custom scales)
const eventSurvey = {
  title: "Évaluation d'un Évènement",
  description: "Questionnaire d'évaluation d'un évènement avec 10 questions clés",
  segments: [
    {
      title: "Évaluation de l'Évènement",
      questions: [
        { text: "Dans quelle mesure l'évènement a-t-il répondu à vos attentes globales ?", ratingLabels: ["Pas du tout", "Peu", "Moyennement", "Bien", "Très bien"] },
        { text: "Les thématiques abordées étaient-elles pertinentes au regard des défis actuels de votre secteur ou de votre institution ?", ratingLabels: ["Pas pertinentes", "Peu pertinentes", "Pertinentes", "Très pertinentes", "Essentielles"] },
        { text: "Comment évaluez-vous la qualité technique et scientifique des présentations et échanges ?", ratingLabels: ["Très faible", "Faible", "Moyenne", "Bonne", "Excellente"] },
        { text: "Quel est votre niveau de satisfaction concernant l'expertise et la crédibilité des intervenants ?", ratingLabels: ["Très insatisfaisant", "Insatisfaisant", "Acceptable", "Satisfaisant", "Très satisfaisant"] },
        { text: "Dans quelle mesure les connaissances acquises vous seront-elles utiles dans votre pratique professionnelle ?", ratingLabels: ["Aucune utilité", "Faible", "Moyenne", "Élevée", "Très élevée"] },
        { text: "Comment jugez-vous la qualité de l'animation, de la modération et de la gestion du temps ?", ratingLabels: ["Très mauvaise", "Mauvaise", "Acceptable", "Bonne", "Excellente"] },
        { text: "Le format de l'évènement a-t-il favorisé des échanges interactifs et la participation des participants ?", ratingLabels: ["Pas du tout", "Peu", "Moyennement", "Bien", "Très bien"] },
        { text: "Comment évaluez-vous l'organisation générale (accueil, logistique, communication, supports) ?", ratingLabels: ["Très insatisfaisante", "Insatisfaisante", "Acceptable", "Satisfaisante", "Très satisfaisante"] },
        { text: "Selon vous, quelle est la valeur ajoutée globale de cet évènement pour votre institution ou votre pays ?", ratingLabels: ["Nulle", "Faible", "Moyenne", "Importante", "Très importante"] },
        { text: "Recommanderiez-vous cet évènement à vos collègues ou partenaires professionnels ?", ratingLabels: ["Non, pas du tout", "Peu probable", "Probable", "Très probable", "Certainement"] },
      ],
    },
  ],
};

// POST /api/init - Initialize default surveys
export async function POST() {
  try {
    const createdSurveys = [];

    // Create MEAL Survey if not exists
    const existingMeal = await db.survey.findFirst({
      where: { title: mealSurvey.title },
    });

    if (!existingMeal) {
      const survey = await db.survey.create({
        data: {
          title: mealSurvey.title,
          description: mealSurvey.description,
          segments: {
            create: mealSurvey.segments.map((segment, segmentIndex) => ({
              title: segment.title,
              order: segmentIndex,
              questions: {
                create: segment.questions.map((question, questionIndex) => ({
                  text: question.text,
                  order: questionIndex,
                  ratingLabels: JSON.stringify(question.ratingLabels),
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
      createdSurveys.push(survey);
    }

    // Create Event Survey if not exists
    const existingEvent = await db.survey.findFirst({
      where: { title: eventSurvey.title },
    });

    if (!existingEvent) {
      const survey = await db.survey.create({
        data: {
          title: eventSurvey.title,
          description: eventSurvey.description,
          segments: {
            create: eventSurvey.segments.map((segment, segmentIndex) => ({
              title: segment.title,
              order: segmentIndex,
              questions: {
                create: segment.questions.map((question, questionIndex) => ({
                  text: question.text,
                  order: questionIndex,
                  ratingLabels: JSON.stringify(question.ratingLabels),
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
      createdSurveys.push(survey);
    }

    return NextResponse.json({ 
      message: 'Surveys initialized', 
      created: createdSurveys.length,
      surveys: createdSurveys 
    }, { status: 201 });
  } catch (error) {
    console.error('Error initializing surveys:', error);
    return NextResponse.json({ error: 'Failed to initialize surveys' }, { status: 500 });
  }
}

// GET /api/init - Check initialization status
export async function GET() {
  try {
    const surveys = await db.survey.findMany({
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    return NextResponse.json({
      initialized: surveys.length > 0,
      surveys,
    });
  } catch (error) {
    console.error('Error checking initialization:', error);
    return NextResponse.json({ error: 'Failed to check initialization' }, { status: 500 });
  }
}
