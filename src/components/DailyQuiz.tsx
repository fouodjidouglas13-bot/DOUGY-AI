import React, { useState } from "react";
import { ResearchProject } from "../types";
import {
  GraduationCap,
  Trophy,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Sparkles,
  RefreshCw,
  Award,
  ChevronRight,
  Plus
} from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  subject: string;
  questions: Question[];
}

interface DailyQuizProps {
  projects: ResearchProject[];
}

export default function DailyQuiz({ projects = [] }: DailyQuizProps) {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Core quiz game state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [answersStatus, setAnswersStatus] = useState<Array<{ questionId: number; correct: boolean; chosen: string }>>([]);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Set default core subjects
  const defaultSubjects = [
    "Quantum Computing Structures",
    "Solid State Lithium Battery Chemistry",
    "CRISPR Gene Editing Mechanics",
    "Transformer Neural Network Architecture",
    "Astrophysics & Cosmic Gravity Mechanics",
    "Next-gen Solar Cell Efficiencies"
  ];

  // List of all eligible subject options
  const historySubjects = projects.map((p) => p.topic).filter((v, i, self) => self.indexOf(v) === i);
  const combinedSubjectsList = [...defaultSubjects, ...historySubjects];

  const handleStartQuiz = async (subject: string) => {
    if (!subject.trim()) return;
    setIsLoading(true);
    setError(null);
    setActiveQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerLocked(false);
    setAnswersStatus([]);
    setScore(0);
    setQuizFinished(false);

    try {
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject })
      });

      if (!response.ok) {
        throw new Error("Unable to formulate scholastic challenge. Please verify api routes.");
      }

      const data = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error("Formulated quiz did not return questions context. Try again.");
      }

      setActiveQuiz(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Scholastic service temporary timeout. Verify core API state.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (option: string) => {
    if (isAnswerLocked) return;
    setSelectedAnswer(option);
  };

  const handleLockInAnswer = () => {
    if (!activeQuiz || selectedAnswer === null || isAnswerLocked) return;

    const currentQuestion = activeQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    setAnswersStatus((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        correct: isCorrect,
        chosen: selectedAnswer
      }
    ]);

    if (isCorrect) {
      setScore((s) => s + 1);
    }

    setIsAnswerLocked(true);
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuestionIndex === activeQuiz.questions.length - 1) {
      setQuizFinished(true);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerLocked(false);
    }
  };

  const handleRestartSelectedSubject = () => {
    if (activeQuiz) {
      handleStartQuiz(activeQuiz.subject);
    }
  };

  const handleResetToSetup = () => {
    setActiveQuiz(null);
    setQuizFinished(false);
    setSelectedSubject("");
    setCustomSubject("");
    setError(null);
  };

  const getPercentageScore = () => {
    if (!activeQuiz) return 0;
    return Math.round((score / activeQuiz.questions.length) * 100);
  };

  const getFeedbackMessage = () => {
    const percentage = getPercentageScore();
    if (percentage === 100) return { title: "Academic Mastermind!", text: "Perfect theoretical score. Your synthesis and alignment across core parameters is absolute.", color: "text-emerald-700 bg-emerald-50 border-emerald-100" };
    if (percentage >= 80) return { title: "Excellent Professional Competency", text: "Outstanding command over core terminology and structural dependencies.", color: "text-indigo-700 bg-indigo-50 border-indigo-100" };
    if (percentage >= 60) return { title: "Good Conceptual Baseline", text: "Satisfactory analytical comprehension. Minor review of the cited documents is recommended.", color: "text-amber-700 bg-amber-50 border-amber-100" };
    return { title: "Foundational Insight Needed", text: "Core theories require additional investigation. Return to our Live Crawler to gather more facts.", color: "text-rose-700 bg-rose-50 border-rose-100" };
  };

  return (
    <div id="quiz-sandbox" className="space-y-6">
      {/* 1. QUIZ SETUP / INDEX SCREEN */}
      {!activeQuiz && !isLoading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-650 shrink-0">
              <GraduationCap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Scholastic Daily Challenge</h2>
              <p className="text-xs text-slate-500 font-medium">Verify your memory of recent research pillars or academic themes</p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-rose-800">Quiz Compilation Error</p>
                <p className="text-rose-700 mt-0.5 leading-relaxed font-semibold">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                Choose Subject Challenge
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {combinedSubjectsList.map((subj, index) => {
                  const isPastReport = historySubjects.includes(subj);
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSelectedSubject(subj);
                        handleStartQuiz(subj);
                      }}
                      className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 hover:border-slate-300 text-left p-4 rounded-xl transition-all flex justify-between items-center group cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          {isPastReport ? "Historical Search Topic" : "Standard subject"}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 tracking-tight truncate mt-1">
                          {subj}
                        </h4>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom parameters formulation */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                Type Another Subject
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  id="custom-quiz-subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="E.g., Microplastics in bottled water, ancient mesopotamian economics..."
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium"
                />
                <button
                  onClick={() => handleStartQuiz(customSubject)}
                  disabled={!customSubject.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Formulate Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOADING STATE */}
      {isLoading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm flex flex-col items-center justify-center py-16 text-center space-y-5 animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-150 animate-bounce">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Formulating Interactive Challenge</h3>
            <p className="text-xs text-slate-500 max-w-xs font-semibold leading-relaxed">
              Synthesizing key definitions, building balanced options, and drafting double-grounded explanation parameters...
            </p>
          </div>
          <div className="w-48 h-1.5 bg-slate-105 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-650 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* 3. ACTIVE QUIZ PLAYGROUND */}
      {activeQuiz && !quizFinished && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          {/* Top Wizard HUD */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-150 px-2.5 py-0.5 rounded-full inline-block">
                Subject: {activeQuiz.subject}
              </span>
              <h3 className="text-sm mt-1.5 font-bold text-slate-550">
                Cognitive Training Sequence
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">
                Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
              </span>
              <div className="flex gap-1.5 ml-1">
                {activeQuiz.questions.map((_, idx) => {
                  const attempted = idx < answersStatus.length;
                  const isCorrect = attempted && answersStatus[idx]?.correct;
                  const active = idx === currentQuestionIndex;
                  return (
                    <span
                      key={idx}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        active
                          ? "ring-2 ring-indigo-500 ring-offset-2 bg-indigo-600Scale bg-indigo-600 animate-pulse"
                          : isCorrect
                          ? "bg-emerald-500"
                          : attempted
                          ? "bg-rose-500"
                          : "bg-slate-200"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-5">
            <h1 className="text-sm md:text-[15px] font-bold text-slate-900 leading-relaxed bg-slate-50 border border-slate-150 rounded-xl p-5 shadow-inner">
              {activeQuiz.questions[currentQuestionIndex].question}
            </h1>

            {/* Answer Options list */}
            <div className="space-y-2.5">
              {activeQuiz.questions[currentQuestionIndex].options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const isCorrectAnswer = option === activeQuiz.questions[currentQuestionIndex].correctAnswer;
                
                // Color codes
                let btnStyle = "bg-white border-slate-200 text-slate-700 hover:bg-slate-50";
                if (isSelected && !isAnswerLocked) {
                  btnStyle = "bg-indigo-50/50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500";
                } else if (isAnswerLocked) {
                  if (isCorrectAnswer) {
                    btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500 font-bold";
                  } else if (isSelected) {
                    btnStyle = "bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-500 font-semibold";
                  } else {
                    btnStyle = "bg-white border-slate-150 text-slate-400 opacity-60";
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswerLocked}
                    onClick={() => handleSelectAnswer(option)}
                    className={`w-full text-left text-xs py-3.5 px-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{option}</span>
                    <span className="shrink-0 flex items-center justify-center">
                      {isAnswerLocked && isCorrectAnswer && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      {isAnswerLocked && isSelected && !isCorrectAnswer && (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation Box appears immediately when answer is locked */}
          {isAnswerLocked && (
            <div className="bg-amber-50/40 border border-amber-100 p-5 rounded-xl space-y-2.5 animate-fadeIn">
              <div className="flex items-center gap-2 text-amber-850">
                <Lightbulb className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono">Scholastic Explanation</span>
              </div>
              <p className="text-[11.5px] text-slate-750 font-medium leading-relaxed">
                {activeQuiz.questions[currentQuestionIndex].explanation}
              </p>
            </div>
          )}

          {/* Next Sequence controls */}
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center gap-4">
            <button
              onClick={handleResetToSetup}
              className="text-[11px] text-slate-500 font-bold hover:text-slate-800 transition-colors bg-slate-50 px-3.5 py-2.5 rounded-xl cursor-pointer border border-slate-200"
            >
              Exit Challenge
            </button>

            {!isAnswerLocked ? (
              <button
                onClick={handleLockInAnswer}
                disabled={selectedAnswer === null}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs py-3 px-6 rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              >
                Validate Choice
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-6 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {currentQuestionIndex === activeQuiz.questions.length - 1 ? "Finish Strategy Game" : "Next Definition Parameters"}
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. PERFORMANCE RESULTS COMPLETED */}
      {quizFinished && activeQuiz && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 text-center max-w-xl mx-auto">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-650 shadow-inner">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">Challenge Completed</span>
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                {activeQuiz.subject} Challenge
              </h2>
            </div>

            {/* Score visual widget */}
            <div className="py-2.5">
              <div className="inline-flex flex-col items-center justify-center bg-slate-50 border border-slate-200 w-32 h-32 rounded-full shadow-inner ring-4 ring-indigo-50/50">
                <span className="text-3xl font-extrabold text-slate-900 font-mono leading-none">
                  {score} <span className="text-slate-400 text-sm font-semibold">/ {activeQuiz.questions.length}</span>
                </span>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-450 mt-1 leading-none">
                  {getPercentageScore()}% Score
                </span>
              </div>
            </div>

            {/* Structured feedback */}
            <div className={`p-4 rounded-xl border w-full text-left space-y-1.5 ${getFeedbackMessage().color}`}>
              <h4 className="font-extrabold text-xs flex items-center gap-1.5">
                <Trophy className="w-4 h-4 shrink-0" />
                {getFeedbackMessage().title}
              </h4>
              <p className="text-[11.5px] leading-relaxed font-semibold">
                {getFeedbackMessage().text}
              </p>
            </div>
          </div>

          {/* Action buttons controls */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <button
              onClick={handleRestartSelectedSubject}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              Retake Challenge
            </button>
            <button
              onClick={handleResetToSetup}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs py-3 px-4 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              Change Subject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
