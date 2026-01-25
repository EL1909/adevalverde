
export type OptionLetter = 'A' | 'B' | 'C' | 'D';

export interface Option {
  id: OptionLetter;
  text: string;
}

export interface Question {
  id: number;
  text: string;
  imageUrl?: string; // Nueva propiedad para las imágenes del PDF
  options: Option[];
}

export interface Scores {
  A: number;
  B: number;
  C: number;
  D: number;
}

export type ResultType = 'PRISIONERO' | 'SITIADO' | 'PURIFICACION' | 'SOBERANO' | 'EMPATE';

export interface ResultDetail {
  title: string;
  subtitle: string;
  description: string[];
  ctaText: string;
  image: string;
}
