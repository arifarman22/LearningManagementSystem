export {};

const BASE = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:1337';
const api  = (path: string) => `${BASE}/api${path}`;

async function req(method: string, url: string, body?: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) as any };
}

const get  = (url: string, token?: string)            => req('GET',    url, undefined, token);
const post = (url: string, body: any, token?: string) => req('POST',   url, body,      token);
const put  = (url: string, body: any, token?: string) => req('PUT',    url, body,      token);
const del  = (url: string, token?: string)            => req('DELETE', url, undefined, token);

const ADMIN      = { email: 'admin@test.com',       password: 'Admin1234!' };
const INSTRUCTOR = { email: 'instructor@test.com',  password: 'Instructor1!' };
const INSTRUCTOR2= { email: 'instructor2@test.com', password: 'Instructor2!' };
const STUDENT    = { email: 'student@test.com',     password: 'Student1234!' };

async function login(creds: { email: string; password: string }): Promise<string> {
  const res = await post(api('/auth/local'), { identifier: creds.email, password: creds.password });
  if (!res.body.jwt) throw new Error(`Login failed for ${creds.email}: ${JSON.stringify(res.body)}`);
  return res.body.jwt;
}

jest.setTimeout(30000);

let tokens: Record<string, string> = {};

// ── shared state ──────────────────────────────────────────────────────────────
let courseDocId:   string;
let courseNumId:   number;
let course2DocId:  string;
let quizDocId:     string;
let quizNumId:     number;
let quiz2DocId:    string; // quiz on course2
let q1Id:          number; // question 1
let q2Id:          number; // question 2
let q1CorrectOptId:  number;
let q1WrongOptId:    number;
let q2CorrectOptId:  number;
let q2WrongOptId:    number;
// option belonging to quiz2 (different course)
let otherQuizOptId:  number;
let otherQuizQId:    number;

beforeAll(async () => {
  tokens.admin      = await login(ADMIN);
  tokens.instructor = await login(INSTRUCTOR);
  tokens.instructor2= await login(INSTRUCTOR2);
  tokens.student    = await login(STUDENT);
}, 20000);

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════════════════════

describe('Setup — courses, quizzes, questions, options, enrollment', () => {
  it('creates and publishes course1 (instructor)', async () => {
    const res = await post(api('/courses'), {
      data: { title: 'Quiz Course', description: 'Course for quiz tests.' },
    }, tokens.instructor);
    expect(res.status).toBe(201);
    courseDocId = res.body.data.documentId;
    courseNumId = res.body.data.id;

    const pub = await req('PATCH', api(`/courses/${courseDocId}/publish`), {}, tokens.instructor);
    expect(pub.status).toBe(200);
  });

  it('creates course2 (instructor2)', async () => {
    const res = await post(api('/courses'), {
      data: { title: 'Quiz Course 2', description: 'Owned by instructor2.' },
    }, tokens.instructor2);
    expect(res.status).toBe(201);
    course2DocId = res.body.data.documentId;

    const pub = await req('PATCH', api(`/courses/${course2DocId}/publish`), {}, tokens.instructor2);
    expect(pub.status).toBe(200);
  });

  it('instructor creates a quiz on course1', async () => {
    const res = await post(api('/quizzes'), {
      data: { title: 'Quiz Alpha', course: courseDocId },
    }, tokens.instructor);
    expect(res.status).toBe(201);
    quizDocId = res.body.data.documentId;
    quizNumId = res.body.data.id;
  });

  it('instructor2 creates a quiz on course2', async () => {
    const res = await post(api('/quizzes'), {
      data: { title: 'Quiz Beta', course: course2DocId },
    }, tokens.instructor2);
    expect(res.status).toBe(201);
    quiz2DocId = res.body.data.documentId;
  });

  it('instructor creates 2 questions on quiz1', async () => {
    const r1 = await post(api('/questions'), {
      data: { text: 'What is 2+2?', order: 1, quiz: quizNumId },
    }, tokens.instructor);
    expect(r1.status).toBe(201);
    q1Id = r1.body.data.id;

    const r2 = await post(api('/questions'), {
      data: { text: 'What is the capital of France?', order: 2, quiz: quizNumId },
    }, tokens.instructor);
    expect(r2.status).toBe(201);
    q2Id = r2.body.data.id;
  });

  it('instructor creates options for question 1', async () => {
    const correct = await post(api('/options'), {
      data: { text: '4', isCorrect: true, question: q1Id },
    }, tokens.instructor);
    expect(correct.status).toBe(201);
    q1CorrectOptId = correct.body.data.id;

    const wrong = await post(api('/options'), {
      data: { text: '5', isCorrect: false, question: q1Id },
    }, tokens.instructor);
    expect(wrong.status).toBe(201);
    q1WrongOptId = wrong.body.data.id;
  });

  it('instructor creates options for question 2', async () => {
    const correct = await post(api('/options'), {
      data: { text: 'Paris', isCorrect: true, question: q2Id },
    }, tokens.instructor);
    expect(correct.status).toBe(201);
    q2CorrectOptId = correct.body.data.id;

    const wrong = await post(api('/options'), {
      data: { text: 'London', isCorrect: false, question: q2Id },
    }, tokens.instructor);
    expect(wrong.status).toBe(201);
    q2WrongOptId = wrong.body.data.id;
  });

  it('instructor2 creates a question+option on quiz2 (different course)', async () => {
    const quiz2Res = await get(api(`/quizzes/${quiz2DocId}`), tokens.instructor2);
    const quiz2NumId = quiz2Res.body.data.id;

    const qRes = await post(api('/questions'), {
      data: { text: 'Other course question', order: 1, quiz: quiz2NumId },
    }, tokens.instructor2);
    expect(qRes.status).toBe(201);
    otherQuizQId = qRes.body.data.id;

    const oRes = await post(api('/options'), {
      data: { text: 'Other option', isCorrect: false, question: otherQuizQId },
    }, tokens.instructor2);
    expect(oRes.status).toBe(201);
    otherQuizOptId = oRes.body.data.id;
  });

  it('student enrolls in course1', async () => {
    const res = await post(api('/enrollments'), {
      data: { course: courseDocId },
    }, tokens.student);
    expect(res.status).toBe(201);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ MANAGEMENT — access control
// ═══════════════════════════════════════════════════════════════════════════════

describe('Quiz — Access Control', () => {
  it('student cannot create a quiz', async () => {
    const res = await post(api('/quizzes'), {
      data: { title: 'Student Quiz', course: courseDocId },
    }, tokens.student);
    expect(res.status).toBe(403);
  });

  it('unauthenticated cannot create a quiz', async () => {
    const res = await post(api('/quizzes'), {
      data: { title: 'Anon Quiz', course: courseDocId },
    });
    expect([401, 403]).toContain(res.status);
  });

  it("instructor cannot create a quiz on another instructor's course", async () => {
    const res = await post(api('/quizzes'), {
      data: { title: 'Hijack Quiz', course: course2DocId },
    }, tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('student cannot update a quiz', async () => {
    const res = await put(api(`/quizzes/${quizDocId}`), {
      data: { title: 'Student Update' },
    }, tokens.student);
    expect(res.status).toBe(403);
  });

  it("instructor cannot update another instructor's quiz", async () => {
    const res = await put(api(`/quizzes/${quiz2DocId}`), {
      data: { title: 'Hijacked' },
    }, tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('instructor can update their own quiz', async () => {
    const res = await put(api(`/quizzes/${quizDocId}`), {
      data: { title: 'Quiz Alpha Updated' },
    }, tokens.instructor);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Quiz Alpha Updated');
  });

  it('student cannot delete a quiz', async () => {
    const res = await del(api(`/quizzes/${quizDocId}`), tokens.student);
    expect(res.status).toBe(403);
  });

  it("instructor cannot delete another instructor's quiz", async () => {
    const res = await del(api(`/quizzes/${quiz2DocId}`), tokens.instructor);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY — isCorrect never exposed to student
// ═══════════════════════════════════════════════════════════════════════════════

describe('Security — isCorrect not exposed to student', () => {
  it('student fetching options does not see isCorrect', async () => {
    const res = await get(api(`/options?filters[question]=${q1Id}`), tokens.student);
    expect(res.status).toBe(200);
    for (const item of res.body.data ?? []) {
      const attrs = item.attributes ?? item;
      expect(attrs).not.toHaveProperty('isCorrect');
    }
  });

  it('student fetching a single option does not see isCorrect', async () => {
    const res = await get(api(`/options/${q1CorrectOptId}`), tokens.student);
    expect(res.status).toBe(200);
    const attrs = res.body.data?.attributes ?? res.body.data;
    expect(attrs).not.toHaveProperty('isCorrect');
  });

  it('instructor can see isCorrect on options', async () => {
    const res = await get(api(`/options/${q1CorrectOptId}`), tokens.instructor);
    expect(res.status).toBe(200);
    const attrs = res.body.data?.attributes ?? res.body.data;
    expect(attrs).toHaveProperty('isCorrect');
    expect(attrs.isCorrect).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ SUBMISSION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Quiz Submission — valid quiz, all correct', () => {
  it('enrolled student submits all correct answers', async () => {
    const res = await post(api('/quiz-results/submit'), {
      quizId: quizNumId,
      answers: { [q1Id]: q1CorrectOptId, [q2Id]: q2CorrectOptId },
    }, tokens.student);
    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(100);
    expect(res.body.data.correctAnswers).toBe(2);
    expect(res.body.data.totalQuestions).toBe(2);
    expect(res.body.data.submittedAt).toBeTruthy();
  });
});

describe('Quiz Submission — repeated submission blocked', () => {
  it('student cannot submit the same quiz twice', async () => {
    const res = await post(api('/quiz-results/submit'), {
      quizId: quizNumId,
      answers: { [q1Id]: q1CorrectOptId, [q2Id]: q2CorrectOptId },
    }, tokens.student);
    expect(res.status).toBe(409);
  });
});

// ── For remaining submission tests we need a fresh student-like scenario.
// We reuse instructor2 as a "second student" by enrolling them — but instructor2
// is not a student role. Instead we test score variants via admin-created results
// by checking the grading logic through a second quiz approach.
// The cleanest approach: create a second quiz on course1 for partial/wrong tests.

let quiz3NumId: number;
let quiz3DocId: string;
let q3Id: number;
let q4Id: number;
let q3CorrectOptId: number;
let q3WrongOptId:   number;
let q4CorrectOptId: number;
let q4WrongOptId:   number;

describe('Setup — second quiz for score variant tests', () => {
  it('admin creates a second quiz on course1', async () => {
    const res = await post(api('/quizzes'), {
      data: { title: 'Quiz Score Variants', course: courseDocId },
    }, tokens.admin);
    expect(res.status).toBe(201);
    quiz3DocId = res.body.data.documentId;
    quiz3NumId = res.body.data.id;
  });

  it('admin creates questions and options for quiz3', async () => {
    const r1 = await post(api('/questions'), {
      data: { text: 'Q3-1', order: 1, quiz: quiz3NumId },
    }, tokens.admin);
    expect(r1.status).toBe(201);
    q3Id = r1.body.data.id;

    const r2 = await post(api('/questions'), {
      data: { text: 'Q3-2', order: 2, quiz: quiz3NumId },
    }, tokens.admin);
    expect(r2.status).toBe(201);
    q4Id = r2.body.data.id;

    const c1 = await post(api('/options'), { data: { text: 'Correct', isCorrect: true,  question: q3Id } }, tokens.admin);
    expect(c1.status).toBe(201);
    q3CorrectOptId = c1.body.data.id;

    const w1 = await post(api('/options'), { data: { text: 'Wrong',   isCorrect: false, question: q3Id } }, tokens.admin);
    expect(w1.status).toBe(201);
    q3WrongOptId = w1.body.data.id;

    const c2 = await post(api('/options'), { data: { text: 'Correct', isCorrect: true,  question: q4Id } }, tokens.admin);
    expect(c2.status).toBe(201);
    q4CorrectOptId = c2.body.data.id;

    const w2 = await post(api('/options'), { data: { text: 'Wrong',   isCorrect: false, question: q4Id } }, tokens.admin);
    expect(w2.status).toBe(201);
    q4WrongOptId = w2.body.data.id;
  });
});

describe('Quiz Submission — all incorrect', () => {
  it('enrolled student submits all wrong answers scores 0', async () => {
    const res = await post(api('/quiz-results/submit'), {
      quizId: quiz3NumId,
      answers: { [q3Id]: q3WrongOptId, [q4Id]: q4WrongOptId },
    }, tokens.student);
    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(0);
    expect(res.body.data.correctAnswers).toBe(0);
    expect(res.body.data.totalQuestions).toBe(2);
  });
});

let quiz4NumId: number;
let quiz4DocId: string;
let q5Id: number;
let q6Id: number;
let q5CorrectOptId: number;
let q5WrongOptId:   number;
let q6CorrectOptId: number;
let q6WrongOptId:   number;

describe('Setup — third quiz for partial score test', () => {
  it('admin creates quiz4 on course1', async () => {
    const res = await post(api('/quizzes'), {
      data: { title: 'Quiz Partial', course: courseDocId },
    }, tokens.admin);
    expect(res.status).toBe(201);
    quiz4DocId = res.body.data.documentId;
    quiz4NumId = res.body.data.id;

    const r1 = await post(api('/questions'), { data: { text: 'P-Q1', order: 1, quiz: quiz4NumId } }, tokens.admin);
    q5Id = r1.body.data.id;
    const r2 = await post(api('/questions'), { data: { text: 'P-Q2', order: 2, quiz: quiz4NumId } }, tokens.admin);
    q6Id = r2.body.data.id;

    const c1 = await post(api('/options'), { data: { text: 'Correct', isCorrect: true,  question: q5Id } }, tokens.admin);
    q5CorrectOptId = c1.body.data.id;
    const w1 = await post(api('/options'), { data: { text: 'Wrong',   isCorrect: false, question: q5Id } }, tokens.admin);
    q5WrongOptId = w1.body.data.id;
    const c2 = await post(api('/options'), { data: { text: 'Correct', isCorrect: true,  question: q6Id } }, tokens.admin);
    q6CorrectOptId = c2.body.data.id;
    const w2 = await post(api('/options'), { data: { text: 'Wrong',   isCorrect: false, question: q6Id } }, tokens.admin);
    q6WrongOptId = w2.body.data.id;
  });
});

describe('Quiz Submission — partial score', () => {
  it('enrolled student gets 50% for 1 of 2 correct', async () => {
    const res = await post(api('/quiz-results/submit'), {
      quizId: quiz4NumId,
      answers: { [q5Id]: q5CorrectOptId, [q6Id]: q6WrongOptId },
    }, tokens.student);
    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(50);
    expect(res.body.data.correctAnswers).toBe(1);
    expect(res.body.data.totalQuestions).toBe(2);
  });
});

// ── Quiz for tamper tests (student hasn't submitted yet)
let quiz5NumId: number;
let quiz5DocId: string;
let q7Id: number;
let q8Id: number;
let q7CorrectOptId: number;
let q8CorrectOptId: number;
let q8WrongOptId:   number;

describe('Setup — quiz for tamper/invalid tests', () => {
  it('admin creates quiz5 on course1', async () => {
    const res = await post(api('/quizzes'), {
      data: { title: 'Quiz Tamper Tests', course: courseDocId },
    }, tokens.admin);
    expect(res.status).toBe(201);
    quiz5DocId = res.body.data.documentId;
    quiz5NumId = res.body.data.id;

    const r1 = await post(api('/questions'), { data: { text: 'T-Q1', order: 1, quiz: quiz5NumId } }, tokens.admin);
    q7Id = r1.body.data.id;
    const r2 = await post(api('/questions'), { data: { text: 'T-Q2', order: 2, quiz: quiz5NumId } }, tokens.admin);
    q8Id = r2.body.data.id;

    const c1 = await post(api('/options'), { data: { text: 'Correct', isCorrect: true,  question: q7Id } }, tokens.admin);
    q7CorrectOptId = c1.body.data.id;
    const c2 = await post(api('/options'), { data: { text: 'Correct', isCorrect: true,  question: q8Id } }, tokens.admin);
    q8CorrectOptId = c2.body.data.id;
    const w2 = await post(api('/options'), { data: { text: 'Wrong',   isCorrect: false, question: q8Id } }, tokens.admin);
    q8WrongOptId = w2.body.data.id;
  });
});

describe('Quiz Submission — invalid option (does not exist)', () => {
  it('rejects submission with a non-existent option id', async () => {
    const res = await post(api('/quiz-results/submit'), {
      quizId: quiz5NumId,
      answers: { [q7Id]: 999999, [q8Id]: q8CorrectOptId },
    }, tokens.student);
    expect(res.status).toBe(400);
  });
});

describe('Quiz Submission — option from another question', () => {
  it('rejects option that belongs to a different question', async () => {
    // q8WrongOptId belongs to q8, not q7
    const res = await post(api('/quiz-results/submit'), {
      quizId: quiz5NumId,
      answers: { [q7Id]: q8WrongOptId, [q8Id]: q8CorrectOptId },
    }, tokens.student);
    expect(res.status).toBe(400);
  });
});

describe('Quiz Submission — question from another quiz', () => {
  it('rejects a question id that belongs to a different quiz', async () => {
    // q1Id belongs to quizNumId (quiz1), not quiz5NumId
    const res = await post(api('/quiz-results/submit'), {
      quizId: quiz5NumId,
      answers: { [q1Id]: q1CorrectOptId, [q8Id]: q8CorrectOptId },
    }, tokens.student);
    expect(res.status).toBe(400);
  });
});

describe('Quiz Submission — quiz from another course (non-enrolled)', () => {
  it('student cannot submit a quiz for a course they are not enrolled in', async () => {
    const quiz2Res = await get(api(`/quizzes/${quiz2DocId}`), tokens.instructor2);
    const quiz2NumId = quiz2Res.body.data.id;

    const res = await post(api('/quiz-results/submit'), {
      quizId: quiz2NumId,
      answers: { [otherQuizQId]: otherQuizOptId },
    }, tokens.student);
    expect(res.status).toBe(403);
  });
});

describe('Quiz Submission — non-enrolled student', () => {
  it('instructor (not a student) cannot submit a quiz', async () => {
    const res = await post(api('/quiz-results/submit'), {
      quizId: quiz5NumId,
      answers: { [q7Id]: q7CorrectOptId, [q8Id]: q8CorrectOptId },
    }, tokens.instructor);
    expect(res.status).toBe(403);
  });

  it('unauthenticated user cannot submit a quiz', async () => {
    const res = await post(api('/quiz-results/submit'), {
      quizId: quiz5NumId,
      answers: { [q7Id]: q7CorrectOptId },
    });
    expect([401, 403]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ RESULTS — access control
// ═══════════════════════════════════════════════════════════════════════════════

describe('Quiz Results — access control', () => {
  it('student can list their own results', async () => {
    const res = await get(api('/quiz-results'), tokens.student);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('instructor can list results for their own course quizzes', async () => {
    const res = await get(api('/quiz-results'), tokens.instructor);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('instructor2 sees no results (student not enrolled in their course)', async () => {
    const res = await get(api('/quiz-results'), tokens.instructor2);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  it('admin can list all results', async () => {
    const res = await get(api('/quiz-results'), tokens.admin);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('student cannot access another student result by id (uses instructor token as proxy)', async () => {
    // Get a result id from student's results
    const listRes = await get(api('/quiz-results'), tokens.student);
    const resultDocId = listRes.body.data[0]?.documentId;
    expect(resultDocId).toBeTruthy();

    // instructor2 is not the student and not the course owner
    const res = await get(api(`/quiz-results/${resultDocId}`), tokens.instructor2);
    expect(res.status).toBe(403);
  });

  it('student can fetch their own result by id', async () => {
    const listRes = await get(api('/quiz-results'), tokens.student);
    const resultDocId = listRes.body.data[0]?.documentId;
    const res = await get(api(`/quiz-results/${resultDocId}`), tokens.student);
    expect(res.status).toBe(200);
  });

  it('instructor can fetch a result for their own course', async () => {
    const listRes = await get(api('/quiz-results'), tokens.instructor);
    const resultDocId = listRes.body.data[0]?.documentId;
    const res = await get(api(`/quiz-results/${resultDocId}`), tokens.instructor);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEARDOWN
// ═══════════════════════════════════════════════════════════════════════════════

afterAll(async () => {
  if (courseDocId)  await req('DELETE', api(`/courses/${courseDocId}`),  undefined, tokens.admin);
  if (course2DocId) await req('DELETE', api(`/courses/${course2DocId}`), undefined, tokens.admin);
});
