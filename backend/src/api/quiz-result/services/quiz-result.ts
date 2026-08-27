import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::quiz-result.quiz-result' as any, ({ strapi }) => ({

  async submitQuiz(studentId: number, quizId: number, answers: Record<number, number>) {
    // answers: { [questionId]: selectedOptionId }

    // Prevent duplicate submission
    const existing = await strapi.db.query('api::quiz-result.quiz-result').findOne({
      where: { student: studentId, quiz: quizId },
    });
    if (existing) {
      throw { status: 409, message: 'You have already submitted this quiz' };
    }

    // Load all questions with their options (server-side, includes isCorrect)
    const questions = await strapi.db.query('api::question.question').findMany({
      where: { quiz: quizId },
      populate: ['options'],
    });

    if (!questions.length) {
      throw { status: 400, message: 'Quiz has no questions' };
    }

    // Build lookup: questionId -> Set of valid optionIds for that question
    const questionMap = new Map<number, any>(questions.map((q: any) => [q.id, q]));

    // Validate all submitted question IDs belong to this quiz
    for (const qIdStr of Object.keys(answers)) {
      const qId = Number(qIdStr);
      if (!questionMap.has(qId)) {
        throw { status: 400, message: `Question ${qId} does not belong to this quiz` };
      }
    }

    // Validate all submitted option IDs belong to their respective questions
    for (const [qIdStr, optionId] of Object.entries(answers)) {
      const qId = Number(qIdStr);
      const question = questionMap.get(qId);
      const validOptionIds = new Set((question.options ?? []).map((o: any) => o.id));
      if (!validOptionIds.has(Number(optionId))) {
        throw { status: 400, message: `Option ${optionId} does not belong to question ${qId}` };
      }
    }

    // Grade server-side
    let correct = 0;
    for (const question of questions) {
      const selectedOptionId = Number(answers[question.id]);
      if (!selectedOptionId) continue;
      const selectedOption = question.options?.find((o: any) => o.id === selectedOptionId);
      if (selectedOption?.isCorrect) correct++;
    }

    const total = questions.length;
    const score = Math.round((correct / total) * 100 * 100) / 100;

    return strapi.db.query('api::quiz-result.quiz-result').create({
      data: {
        student: studentId,
        quiz: quizId,
        score,
        correctAnswers: correct,
        totalQuestions: total,
        submittedAt: new Date(),
      },
      populate: ['quiz'],
    });
  },
}));
