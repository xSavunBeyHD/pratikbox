export type ToolCategoryId =
  | 'image'
  | 'pdf'
  | 'text'
  | 'developer'
  | 'seo'
  | 'security'
  | 'design';

export interface ToolCategoryInfo {
  id: ToolCategoryId;
  name: string;
  shortName: string;
  description: string;
  iconName: string;
}

export interface ToolFAQ {
  question: string;
  answer: string;
}

export interface ToolDefinition {
  id: string;
  slug: string;
  name: string;
  englishName: string;
  category: ToolCategoryId;
  shortDescription: string;
  seoTitle: string;
  seoDescription: string;
  iconName: string;
  popular?: boolean;
  featured?: boolean;
  keywords: string[];
  steps: string[];
  faqs: ToolFAQ[];
  relatedSlugs: string[];
}
