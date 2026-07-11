import type { ReactNode } from "react";

export interface Slide {
  id: string;
  copy: ReactNode;
  content?: ReactNode;
  notes?: string;
}

export interface Deck {
  id: string;
  title: string;
  createSlides: () => Slide[];
}
