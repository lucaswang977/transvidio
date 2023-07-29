import type { DocumentType } from "@prisma/client"

export type DocumentInfo = {
  id: string,
  title: string,
  updatedAt: Date,
  type: DocumentType,
  projectId: string,
  projectName: string,
  projectAiParamters?: ProjectAiParamters
}

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
  from: number,
  to: number,
  text: string
}

export type SubtitleType = {
  videoUrl: string,
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
  results: QuizItem[]
}

export type ArticleType = {
  html: string
}

export type AttachmentType = {
  filename: string,
  fileurl: string,
}


export type ProjectAiParamters = {
  character: string,
  background: string,
  syllabus: string
}

export type DocPermission = {
  srcReadable: boolean,
  srcWritable: boolean,
  dstReadable: boolean,
  dstWritable: boolean,
}

export type AppConfig = {
  key: string,
  value: string
}

export type UserProfile = {
  name: string,
  avatar: string,
  paymentCurrency: Currency,
  paymentTarget: string,
  paymentMethod: PaymentMethod,
  paymentMemo: string,
}


