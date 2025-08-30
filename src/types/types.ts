export interface Chapter {
  title: string;
  time?: string;
}

export interface Truyen {
  title: string;
  link: string;
  cover: string;
  author: string;
  status: string;
  genres: string[];
  description: string;
  chapters: Chapter[];
  other_name?: string;
  updated_at: string;
  slug: string;
}
