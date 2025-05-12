
import { AIResponse, OnboardingQuestion, PersonalityTraits } from "../types";

// Mock AI service for onboarding flow
class AIService {
  private personality: Partial<PersonalityTraits> = {
    openness: 0.5,
    conscientiousness: 0.5,
    extraversion: 0.5,
    agreeableness: 0.5,
    neuroticism: 0.5,
    communicationStyle: "balanced",
  };

  private onboardingQuestions: OnboardingQuestion[] = [
    {
      id: "q1",
      text: "Hey there! I'm excited to help you set up your profile. What's your name?",
      audioPrompt: "intro_name.mp3",
      responseType: "text",
      minResponseLength: 2,
      maxResponseTime: 30,
    },
    {
      id: "q2",
      text: "Nice to meet you! How old are you?",
      responseType: "text",
      maxResponseTime: 20,
    },
    {
      id: "q3",
      text: "Where are you from?",
      responseType: "text",
      maxResponseTime: 30,
    },
    {
      id: "q4",
      text: "What do you like to do for fun? Tell me a bit about your interests.",
      responseType: "voice",
      minResponseLength: 10,
      maxResponseTime: 60,
      personalityTraitMapped: "openness",
    },
    {
      id: "q5",
      text: "If you could travel anywhere right now, where would you go and why?",
      responseType: "voice",
      minResponseLength: 15,
      maxResponseTime: 60,
      personalityTraitMapped: "extraversion",
    },
    {
      id: "q6",
      text: "Do you prefer quiet nights in or going out with friends?",
      responseType: "multiple-choice",
      options: ["Quiet nights in", "Going out with friends", "It depends on my mood", "A mix of both"],
      personalityTraitMapped: "extraversion",
    },
    {
      id: "q7",
      text: "How would your friends describe your personality?",
      responseType: "voice",
      minResponseLength: 10,
      maxResponseTime: 60,
      personalityTraitMapped: "agreeableness",
    }
  ];

  private conversationHistory: { question: string; response: string }[] = [];

  // Simulates AI processing of user responses
  public async processResponse(question: string, response: string): Promise<AIResponse> {
    // Store in conversation history
    this.conversationHistory.push({ question, response });
    
    // Update personality traits based on response
    this.updatePersonalityTraits(response);
    
    // Get next question
    const currentIndex = this.onboardingQuestions.findIndex(q => q.text === question);
    const nextQuestion = this.onboardingQuestions[currentIndex + 1];
    
    // Generate a friendly response based on the context
    const aiResponse = this.generateResponse(response, currentIndex);
    
    return {
      text: aiResponse,
      nextQuestion: nextQuestion,
      personalityInsight: this.personality,
      suggestedInterests: this.suggestInterests(response),
    };
  }

  // Mock text-to-speech synthesis (in a real app this would call an API)
  public async textToSpeech(text: string): Promise<string> {
    console.log("Converting to speech:", text);
    // In a real app, this would return an audio URL
    return `data:audio/mp3;base64,${btoa(text)}`;
  }

  // Mock speech-to-text conversion (in a real app this would use WebSpeech API or a service)
  public async speechToText(audioBlob: Blob): Promise<string> {
    console.log("Converting speech to text");
    // Mock response - in a real app this would process the audio
    return "This is a mock transcription of what the user said.";
  }

  public getInitialQuestion(): OnboardingQuestion {
    return this.onboardingQuestions[0];
  }

  private generateResponse(userResponse: string, questionIndex: number): string {
    // Simple response generation - in a real app this would be more sophisticated
    const positiveAcknowledgments = [
      "Great!",
      "Awesome!",
      "That's interesting!",
      "I love that!",
      "Thanks for sharing!"
    ];
    
    const randomAcknowledgment = positiveAcknowledgments[Math.floor(Math.random() * positiveAcknowledgments.length)];
    
    if (questionIndex === 0) {
      return `${randomAcknowledgment} Nice to meet you, ${userResponse}!`;
    }
    
    return `${randomAcknowledgment} I'm getting to know you better.`;
  }

  private updatePersonalityTraits(response: string): void {
    // This would be a complex NLP function in a real app
    // Here we just do some very basic keyword analysis
    const keywords = {
      openness: ["new", "explore", "experience", "art", "idea", "creative", "curious"],
      conscientiousness: ["plan", "organize", "detail", "careful", "precise", "responsible", "thorough"],
      extraversion: ["people", "social", "party", "talk", "outgoing", "energetic", "group"],
      agreeableness: ["help", "kind", "cooperate", "friendly", "compassionate", "supportive"],
      neuroticism: ["worry", "stress", "anxious", "nervous", "sensitive"]
    };

    const lowercaseResponse = response.toLowerCase();
    
    // Very simplified trait analysis
    for (const [trait, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (lowercaseResponse.includes(word)) {
          const currentValue = this.personality[trait as keyof PersonalityTraits] as number || 0.5;
          this.personality[trait as keyof PersonalityTraits] = Math.min(1, currentValue + 0.05) as never;
          break;
        }
      }
    }

    // Analyze communication style
    const wordCount = response.split(/\s+/).length;
    const avgWordLength = response.length / wordCount;
    
    if (wordCount > 25) {
      this.personality.communicationStyle = "expressive";
    } else if (avgWordLength > 6) {
      this.personality.communicationStyle = "analytical";
    } else if (response.includes("?")) {
      this.personality.communicationStyle = "inquisitive";
    } else {
      this.personality.communicationStyle = "concise";
    }
  }

  private suggestInterests(response: string): string[] {
    // This would be more sophisticated in a real app
    const interestCategories = [
      ["music", "guitar", "piano", "singing", "concert", "festival"],
      ["sports", "football", "basketball", "soccer", "tennis", "running"],
      ["art", "painting", "drawing", "design", "creative"],
      ["travel", "adventure", "explore", "places", "countries"],
      ["gaming", "video games", "board games", "rpg"],
      ["reading", "books", "literature", "stories"],
      ["movies", "films", "cinema", "tv shows", "series"],
      ["cooking", "baking", "food", "culinary"],
      ["technology", "programming", "coding", "computers"],
      ["fashion", "clothing", "style", "design"]
    ];
    
    const lowercaseResponse = response.toLowerCase();
    const suggestedInterests: string[] = [];
    
    interestCategories.forEach(category => {
      if (category.some(keyword => lowercaseResponse.includes(keyword))) {
        suggestedInterests.push(category[0]);
      }
    });
    
    // Add some default suggestions if none were found
    if (suggestedInterests.length === 0) {
      suggestedInterests.push("music", "travel", "movies");
    }
    
    return suggestedInterests;
  }
}

export default new AIService();
