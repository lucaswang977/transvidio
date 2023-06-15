export type CurriculumItemEnum = "lecture" | "quiz" | "article" | "resource"

export type CurriculumItem = {
  id: number,
  item_type: CurriculumItemEnum,
  title: string,
  description: string
}

export type CurriculumSection = {
  index: number,
  title: string,
  items: CurriculumItem[]
}

export type Curriculum = {
  sections: CurriculumSection[]
}

export type SrcOrDst = "src" | "dst"

export type Introduction = {
  title: string,
  headline: string,
  description: string,
  prerequisites: string[],
  objectives: string[],
  target_audiences: string[]
}

export type SubtitleItem = {
  id: string,
  from: number,
  to: number,
  text: string
}

export type SubtitleType = {
  videoUrl: string,
  originalSubtitleUrl: string,
  subtitle: SubtitleItem[],
}

export type QuizPromptItem = {
  question: string,
  answers: string[],
  feedbacks: string[],
}

export type QuizItem = {
  id: string,
  correct_response: string[],
  prompt: QuizPromptItem
}

export type QuizType = {
  count: number,
  results: QuizItem[]
}

