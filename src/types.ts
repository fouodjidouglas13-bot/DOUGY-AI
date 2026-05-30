export interface KeyFact {
  fact: string;
  context: string;
  metric?: string;
}

export interface Source {
  title: string;
  url: string;
}

export interface Highlight {
  title: string;
  description: string;
  score: number; // 0-100 indicating impact
  tag: string; // e.g. technology, trend, risk, opportunity
}

export interface Section {
  id: string;
  title: string;
  objective: string;
  focusKeywords: string[];
  status: "idle" | "researching" | "completed" | "failed";
  synthesizedText?: string;
  keyFacts?: KeyFact[];
  sources?: Source[];
  error?: string;
}

export interface ResearchPlan {
  title: string;
  scope: string;
  sections: Section[];
}

export interface ResearchProject {
  id: string;
  topic: string;
  title: string;
  scope: string;
  tone: string;
  depth: string;
  status: "setup" | "outline" | "investigating" | "completed" | "failed";
  createdAt: string;
  plan?: ResearchPlan;
  sections: Section[];
  executiveSummary?: string;
  highlights?: Highlight[];
  consolidatedSources?: Source[];
}
