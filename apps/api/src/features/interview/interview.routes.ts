import { Router, type Request, type Response } from "express";
import { store } from "../../lib/store.js";
import { type AuthenticatedRequest } from "../../middleware/auth.js";
import type { Profile } from "../../types/domain.js";
import { submitInterviewAnswerSchema } from "./interview.schemas.js";

// Each profile type gets its own question bank: working professionals are framed around their
// current job, students around academics/projects (no job history yet), and people not currently
// working (career break, laid off, between jobs — but who HAVE worked before) around their most
// recent role and re-entry motivation rather than a job they don't currently have.
const PROFESSIONAL_QUESTION_BANK = [
  "What kind of work makes you lose track of time?",
  "Which project are you most proud of, and what was your direct impact?",
  "What leadership moments shaped your career confidence?",
  "What type of company culture consistently drains your energy?",
  "What are you optimizing for in your next 12 months: title, learning, salary, or flexibility?",
  "How do you usually approach ambiguity and unclear requirements?",
  "What is one risk you are willing to take now that you were not willing to take last year?",
  "What weakness could block your next career level if left unresolved?"
];

const STUDENT_QUESTION_BANK = [
  "What subject or type of problem makes you lose track of time while studying or building things?",
  "Which academic project, hackathon, or personal project are you most proud of, and what was your role?",
  "What leadership or team moments (clubs, group projects, sports) shaped your confidence?",
  "What kind of company culture or team environment do you think would drain your energy?",
  "What are you optimizing for in your first job: learning, brand name, compensation, or flexibility?",
  "How do you usually approach a problem when the requirements aren't fully clear yet?",
  "What's one bold thing you're willing to try now (a different major, internship, or city) that you weren't ready for a year ago?",
  "What skill gap worries you most as you think about starting your career?"
];

const NOT_WORKING_QUESTION_BANK = [
  "What's motivating you to get back into work right now?",
  "Which project or achievement from your career are you most proud of, and what was your direct impact?",
  "What leadership moments from your career shaped your confidence?",
  "What type of company culture do you want to avoid this time around?",
  "What are you optimizing for in your next role: title, learning, salary, or flexibility?",
  "How do you usually approach ambiguity and unclear requirements?",
  "What's one thing about your career break or transition you want a hiring manager to understand?",
  "What skill or confidence gap worries you most about re-entering the workforce?"
];

function getQuestionBank(profile: Profile): string[] {
  if (profile.profileType === "student") return STUDENT_QUESTION_BANK;
  if (profile.profileType === "not_working") return NOT_WORKING_QUESTION_BANK;
  return PROFESSIONAL_QUESTION_BANK;
}

export const interviewRouter = Router();

interviewRouter.get("/profile/:profileId", (req: Request, res: Response) => {
  const profile = store.getProfile(String(req.params.profileId));
  if (!profile || profile.clerkUserId !== (req as AuthenticatedRequest).authUserId) {
    return res.status(403).json({ error: "Forbidden profile access." });
  }

  const existing = store.getInterviewSession(profile.id);
  if (existing) {
    return res.status(200).json({ data: existing });
  }

  const initial = store.saveInterviewSession({
    profileId: profile.id,
    answered: [],
    nextQuestion: getQuestionBank(profile)[0],
    isComplete: false
  });

  return res.status(200).json({ data: initial });
});

interviewRouter.post("/answer", (req: Request, res: Response) => {
  const parsed = submitInterviewAnswerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid interview payload.", details: parsed.error.flatten() });
  }

  const profile = store.getProfile(parsed.data.profileId);
  if (!profile || profile.clerkUserId !== (req as AuthenticatedRequest).authUserId) {
    return res.status(403).json({ error: "Forbidden profile access." });
  }

  const questionBank = getQuestionBank(profile);
  const current = store.getInterviewSession(profile.id) ?? {
    profileId: profile.id,
    answered: [],
    nextQuestion: questionBank[0],
    isComplete: false
  };

  const activeQuestion = current.nextQuestion ?? questionBank[current.answered.length] ?? null;
  if (!activeQuestion) {
    return res.status(409).json({ error: "Interview is already complete." });
  }

  const answered = [...current.answered, { question: activeQuestion, answer: parsed.data.answer }];
  const nextQuestion = questionBank[answered.length] ?? null;
  const isComplete = answered.length >= 6 || nextQuestion === null;

  const saved = store.saveInterviewSession({
    profileId: profile.id,
    answered,
    nextQuestion,
    isComplete
  });

  return res.status(200).json({ data: saved });
});
