export type ImageResolution = '1K' | '2K' | '4K';

export type AgeGroup = 'toddler' | 'preschool' | 'elementary';

export type ArtStyle = 'playful_chibi' | 'classic_storybook' | 'bold_simple' | 'whimsical_doodle';

export interface ColoringPage {
  id: number;
  pageNumber: number;
  title: string;
  caption: string;
  prompt: string;
  imageUrl?: string;
  status: 'idle' | 'generating' | 'done' | 'error';
  error?: string;
}

export interface BookCover {
  title: string;
  subtitle: string;
  childName: string;
  theme: string;
  prompt: string;
  imageUrl?: string;
  status: 'idle' | 'generating' | 'done' | 'error';
  error?: string;
}

export interface ColoringBook {
  id: string;
  childName: string;
  theme: string;
  ageGroup: AgeGroup;
  artStyle: ArtStyle;
  resolution: ImageResolution;
  cover: BookCover;
  pages: ColoringPage[];
  createdAt: string;
  status: 'idle' | 'planning' | 'generating_pages' | 'complete' | 'error';
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  suggestions?: string[];
  suggestedPrompt?: {
    title: string;
    caption: string;
    prompt: string;
  };
}

export type ChatModel = 'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite';

export interface ChatRoleConfig {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  icon: string;
}
