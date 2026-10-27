// 教材データの型(content/SCHEMA.md に対応)

export type StumbleTag =
  | "reading"
  | "symbol"
  | "prerequisite"
  | "why"
  | "confusion"
  | "trap"
  | "calc"
  | "trace";

export type Choice = { id: string; text: string };

type QuestionBase = {
  id: string;
  prompt: string;
  explanation: string;
  readingAid?: string;
  stumbleTags?: StumbleTag[];
  origin: "session" | "session-reconstructed" | "original";
  sourceKey?: string;
  missedInSession?: boolean;
  difficulty?: number;
};

export type ChoiceQuestion = QuestionBase & {
  type: "choice";
  choices: Choice[];
  answer: string;
  wrongReasons?: Record<string, string>;
};

export type NumericQuestion = QuestionBase & {
  type: "numeric";
  answer: number;
  tolerance?: number;
  unit?: string;
};

export type Question = ChoiceQuestion | NumericQuestion;

export type Topic = {
  id: string;
  title: string;
  field: string;
  category: string;
  level?: number;
  sources?: string[];
  summary: string;
  analogy?: string;
  keyPoints?: string[];
  diagram?: { type: "mermaid"; code: string };
  explanation?: string[];
  formulas?: { name: string; expr: string; note?: string }[];
  pitfalls?: { text: string; sourceKey?: string }[];
  prerequisites?: string[];
  related?: string[];
  terms?: { term: string; definition: string }[];
  questions?: Question[];
};

export type Comparison = {
  id: string;
  title: string;
  topicIds?: string[];
  oneLiner: string;
  headers: string[];
  rows: string[][];
};

export type SymbolEntry = {
  id: string;
  symbol: string;
  name: string;
  meaning: string;
  topicIds?: string[];
};

export type Guide = { id: string; title: string; body: string[] };

export type Session = { key: string; title: string; url?: string; date?: string };

export type Pack = {
  schemaVersion: number;
  packId: string;
  title: string;
  createdAt?: string;
  sources?: Session[];
  topics?: Topic[];
  comparisons?: Comparison[];
  symbols?: SymbolEntry[];
  guides?: Guide[];
};

export type LoadedPack = { file: string; pack: Pack };

/** 統合後のトピック。配列フィールドは必ず存在する */
export type MergedTopic = Topic &
  Required<
    Pick<
      Topic,
      | "sources"
      | "keyPoints"
      | "explanation"
      | "formulas"
      | "pitfalls"
      | "prerequisites"
      | "related"
      | "terms"
      | "questions"
    >
  >;

export type MergedContent = {
  topics: MergedTopic[];
  comparisons: Comparison[];
  symbols: SymbolEntry[];
  guides: Guide[];
  sessions: Session[];
  mergeLog: string[];
};
