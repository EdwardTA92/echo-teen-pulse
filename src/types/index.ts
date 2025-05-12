
export interface User {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  profileImage: string;
  personality: PersonalityTraits;
}

export interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  communicationStyle: string;
}

export interface OnboardingQuestion {
  id: string;
  text: string;
  audioPrompt?: string;
  responseType: 'text' | 'voice' | 'multiple-choice';
  options?: string[];
  minResponseLength?: number;
  maxResponseTime?: number; // in seconds
  personalityTraitMapped?: keyof PersonalityTraits;
  followUp?: boolean;
}

export interface AIResponse {
  text: string;
  audioUrl?: string;
  sentiment?: string;
  nextQuestion?: OnboardingQuestion;
  personalityInsight?: Partial<PersonalityTraits>;
  suggestedInterests?: string[];
}
