// FIX: Corrected JSX namespace augmentation. A full import of 'react' is necessary to establish the link to React's JSX namespace before augmenting it within this module. This ensures our custom element is merged with, not replaces, the built-in HTML and SVG element types.
import * as React from 'react';

export type Locale = 'de' | 'en' | 'es' | 'fr' | 'it' | 'pt' | 'ja' | 'ru' | 'zh' | 'hi' | 'ar' | 'nl' | 'ko' | 'tr' | 'pl' | 'sv' | 'no' | 'da' | 'fi' | 'el' | 'id' | 'uk' | 'cs' | 'hu' | 'ro' | 'vi' | 'th' | 'he' | 'bn' | 'ms' | 'fil';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
    React: typeof React;
  }
}

// FIX: Moved JSX namespace augmentation outside of `declare global`.
// This is the correct way to augment a global namespace from within a module.
// It merges with the existing IntrinsicElements instead of replacing it.
declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      src?: string;
      alt?: string;
      'camera-controls'?: boolean;
      'auto-rotate'?: boolean;
      ar?: boolean;
      'shadow-intensity'?: string;
    }, HTMLElement>;
  }
}

export interface User {
  name: string;
  email: string;
}

export interface MemoryFact {
  id: string;
  content: string;
  createdAt: string; // ISO String date
}

export interface CoachGoal {
  id: string;
  content: string;
  createdAt: string; // ISO String date
}

export type ModelType = 'universum-4.0' | 'universum-4.0-schnell';

export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
  COACH = 'coach',
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export type CloudProvider = 'Google Drive' | 'OneDrive';

export type AnalysisStepStatus = 'active' | 'completed' | 'pending';

export interface AnalysisStep {
  id: string;
  title: string;
  status: AnalysisStepStatus;
  type: 'core' | 'agent' | 'task';
  details?: string;
  icon?: string;
}

export interface SlideAnimation {
    type: 'fadeIn' | 'slideIn' | 'flyIn';
    direction?: 'l' | 'r' | 't' | 'b';
    delay?: number;
    duration?: number;
}

export interface SlideElement {
    animation?: SlideAnimation;
}

export interface TextElement extends SlideElement {
    text: string;
    fontFace?: string;
    fontSize?: number;
    color?: string;
    bold?: boolean;
}

export interface ContentElement extends SlideElement {
    type: 'paragraph' | 'bullet';
    items: string[];
}

export interface ImageElement extends SlideElement {
    prompt: string;
    data?: string; // base64 string
}

export interface Slide {
    layout: 'title_only' | 'title_and_content' | 'content_left_image_right' | 'image_left_content_right' | 'image_only' | 'table_of_contents' | 'conclusion';
    title?: TextElement;
    content?: ContentElement;
    image?: ImageElement;
    background?: {
        color?: string;
        gradient?: {
            type: 'linear' | 'radial';
            angle?: number;
            colors: [string, string];
        };
    };
}

export interface PresentationTheme {
    background: {
        color?: string;
        gradient?: {
            type: 'linear' | 'radial';
            angle?: number;
            colors: [string, string];
        };
    };
    titleFontFace: string;
    bodyFontFace: string;
    textColor: string;
}

export interface VideoSearchResult {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
}

export interface Message {
  id:string;
  role: Role;
  contentHistory: string[];
  activeVersionIndex: number;
  imagesData?: {
    mimeType: string;
    data: string;
  }[];
  audioData?: {
    mimeType: string;
    data: string;
    name: string;
  };
  textAttachment?: {
    title: string;
    content: string;
    provider?: CloudProvider;
  };
  groundingChunks?: GroundingChunk[];
  isTyping?: boolean;
  isGeneratingImage?: boolean;
  pdfFile?: {
    filename: string;
    dataUrl: string;
    pageCount: number;
  };
  spreadsheetFile?: {
    filename: string;
    data: { 
      sheets: { sheetName: string; headers: string[]; rows: any[][] }[] 
    };
  };
  presentationFile?: {
    filename: string;
    data: {
      theme: PresentationTheme;
      slides: Slide[];
    };
  };
  isGeneratingCode?: boolean;
  codeBlock?: { code: string; language: string; } | null;
  analysisState?: AnalysisStep[] | null;
  isGeneratingVideo?: boolean;
  videoGenerationStatus?: string;
  videoData?: {
      url: string; // Blob URL or Data URL
      mimeType: string;
  };
  requiresApiKeySelection?: boolean;
  videoSearchResults?: VideoSearchResult[];
  generationTime?: number; // Time in milliseconds
  isGenerating3dModel?: boolean;
  model3dData?: {
    url: string;
    prompt: string;
  };
  isGeneratingWord?: boolean;
  wordData?: {
      filename: string;
  };
  wordFile?: {
      filename: string;
      blob: Blob;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: ModelType;
  createdAt: string; // ISO String date
  isPinned?: boolean;
  forkInfo?: {
    parentConversationId: string;
    parentMessageId: string;
  };
}

export type RecentAttachment =
  | { type: 'text'; title: string; content: string; timestamp: number }
  | { type: 'cloud'; provider: CloudProvider; title: string; content: string; timestamp: number }
  | { type: 'local'; name: string; fileType: 'image' | 'audio'; timestamp: number };