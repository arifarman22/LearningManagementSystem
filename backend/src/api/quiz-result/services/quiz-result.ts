import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::quiz-result.quiz-result' as any, ({ strapi }) => ({

  async submitQuiz(studentId: number, quizId: number, answers: Record<number, number>) {
    // answers: { [questionId]: selectedOptionId }

    // Load all questions with their correct options
    const questions = await strapi.db.query('api::question.question').findMany({
      where: { quiz: quizId },
      populate: ['options'],
    });

    if (!questions.length) {
      throw { status: 400, message: 'Quiz has no questions' };
    }

    let correct = 0;
    for (const question of questions) {
      const selectedOptionId = answers[question.id];
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
