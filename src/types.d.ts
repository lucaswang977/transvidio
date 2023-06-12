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


