
import { AIResponse, OnboardingQuestion, PersonalityTraits } from "../types";
import aiConnectorService from "./aiConnectorService";
import configService from "./configService";

// AI service for onboarding flow with real-time conversation capabilities
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
      text: "Hey there! Welcome to Sparks Fly! I'm excited to help you set up your profile. What's your name?",
      audioPrompt: "intro_name.mp3",
      responseType: "voice",
      minResponseLength: 2,
      maxResponseTime: 30,
      personalityTraitMapped: null,
    },
    {
      id: "q2",
      text: "Nice to meet you! How old are you?",
      responseType: "voice",
      maxResponseTime: 20,
      personalityTraitMapped: null,
      followUp: true,
    },
    {
      id: "q3",
      text: "Where are you from?",
      responseType: "voice",
      maxResponseTime: 30,
      personalityTraitMapped: null,
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
  private timeoutId: number | null = null;
  private mandatoryFieldsCollected: Set<string> = new Set();
  private conversationStartTime: number = 0;
  private timeLimit: number = 300; // Default 5 minutes (300 seconds)

  constructor() {
    this.timeLimit = configService.getTimeLimit();
  }

  // Get all onboarding questions
  public getOnboardingQuestions(): OnboardingQuestion[] {
    return this.onboardingQuestions;
  }

  // Reset timeout for continuous conversation
  public resetTimeout(callback: () => void, timeoutMs: number = 10000): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(callback, timeoutMs) as unknown as number;
  }

  // Clear the conversation timeout
  public clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  // Start the conversation timer
  public startConversationTimer(): void {
    this.conversationStartTime = Date.now();
    this.timeLimit = configService.getTimeLimit();
  }

  // Get remaining conversation time in seconds
  public getRemainingTime(): number {
    if (this.conversationStartTime === 0) return this.timeLimit;
    
    const elapsedMs = Date.now() - this.conversationStartTime;
    const remainingSeconds = Math.max(0, this.timeLimit - Math.floor(elapsedMs / 1000));
    return remainingSeconds;
  }

  // Check if conversation time limit is reached
  public isTimeExpired(): boolean {
    return this.getRemainingTime() <= 0;
  }

  // Get time progress percentage (0-100)
  public getTimeProgress(): number {
    const remaining = this.getRemainingTime();
    return Math.min(100, Math.max(0, 100 - (remaining / this.timeLimit * 100)));
  }

  // Mark a mandatory field as collected
  public markFieldCollected(fieldId: string): void {
    this.mandatoryFieldsCollected.add(fieldId);
  }

  // Check if all mandatory fields are collected
  public areMandatoryFieldsCollected(): boolean {
    const mandatoryFields = ["q1", "q2", "q3"]; // Name, age, location
    return mandatoryFields.every(field => this.mandatoryFieldsCollected.has(field));
  }

  // Get missing mandatory fields
  public getMissingMandatoryFields(): string[] {
    const mandatoryFields = ["q1", "q2", "q3"]; // Name, age, location
    return mandatoryFields.filter(field => !this.mandatoryFieldsCollected.has(field));
  }

  // Simulates AI processing of user responses with real API integration
  public async processResponse(question: string, response: string): Promise<AIResponse> {
    // Store in conversation history
    this.conversationHistory.push({ question, response });
    
    // Update personality traits based on response
    this.updatePersonalityTraits(response);
    
    // Get next question
    const currentIndex = this.onboardingQuestions.findIndex(q => q.text === question);
    const nextQuestion = this.onboardingQuestions[currentIndex + 1];
    
    // Check for mandatory fields
    const extractedInfo = this.extractProfileInfo(response);
    if (extractedInfo.questionId) {
      this.markFieldCollected(extractedInfo.questionId);
    }
    
    // Process with real AI if configured
    let aiResponseText = "";
    
    try {
      const contextInfo = {
        questionId: this.onboardingQuestions[currentIndex]?.id,
        previousResponses: this.conversationHistory.slice(0, -1),
        missingFields: this.getMissingMandatoryFields(),
        timeRemaining: this.getRemainingTime()
      };
      
      // Use the AI connector service if available
      if (configService.isConfigured()) {
        const prompt = `
          The user is responding to this question: "${question}"
          Their response is: "${response}"
          
          Based on this, provide a friendly, conversational response that acknowledges what they said and guides them toward providing information for their profile.
          
          ${this.getMissingMandatoryFields().length > 0 ? 
            `I still need to collect: ${this.getMissingMandatoryFields().join(', ')}` : 
            "I have all required information but can explore their interests and personality more."}
          
          ${this.getRemainingTime() < 60 ? 
            "Time is running short, so be concise and focus on collecting essential information." : 
            ""}
          
          Remember to keep the tone friendly, age-appropriate, and engaging for teen users.
        `;
        
        aiResponseText = await aiConnectorService.processText(prompt, JSON.stringify(contextInfo));
      } else {
        // Fallback to local response generation if no API configured
        aiResponseText = this.generateResponse(response, currentIndex);
      }
    } catch (error) {
      console.error("Error processing with AI:", error);
      aiResponseText = this.generateResponse(response, currentIndex);
    }
    
    return {
      text: aiResponseText,
      nextQuestion: nextQuestion,
      personalityInsight: this.personality,
      suggestedInterests: this.suggestInterests(response),
    };
  }

  // Process open-ended conversation and try to extract profile info
  public async processConversation(userInput: string): Promise<AIResponse> {
    // Try to extract profile information from conversation
    const extractedInfo = this.extractProfileInfo(userInput);
    
    // Update personality traits based on response
    this.updatePersonalityTraits(userInput);
    
    // If we identified specific information, mark it as collected
    if (extractedInfo.questionId) {
      this.markFieldCollected(extractedInfo.questionId);
    }
    
    let aiResponseText = "";
    
    try {
      // Check time remaining and missing fields
      const timeRemaining = this.getRemainingTime();
      const missingFields = this.getMissingMandatoryFields();
      
      const contextInfo = {
        conversationHistory: this.conversationHistory,
        extractedInfo: extractedInfo,
        missingFields: missingFields,
        timeRemaining: timeRemaining,
        timeProgress: this.getTimeProgress()
      };
      
      // Use the AI connector if available
      if (configService.isConfigured()) {
        const prompt = `
          The user said: "${userInput}"
          
          ${extractedInfo.questionId ? 
            `I extracted this information: ${JSON.stringify(extractedInfo)}` : 
            "I couldn't extract any specific profile information from this."}
          
          ${missingFields.length > 0 ? 
            `I still need to collect: ${missingFields.join(', ')}` : 
            "I have all required information but can explore their interests and personality more."}
          
          ${timeRemaining < 60 ? 
            "Time is running short, so be concise and focus on collecting essential information." : 
            ""}
          
          Respond in a friendly, conversational way. If appropriate, guide the conversation toward collecting missing information.
          Remember this is for teenagers 17 and under, so keep it appropriate but still engaging.
        `;
        
        aiResponseText = await aiConnectorService.processText(prompt, JSON.stringify(contextInfo));
      } else {
        // Fallback to local response generation if no API configured
        aiResponseText = this.generateConversationalResponse(userInput, extractedInfo);
      }
    } catch (error) {
      console.error("Error processing conversation with AI:", error);
      aiResponseText = this.generateConversationalResponse(userInput, extractedInfo);
    }
    
    // Check if we need to explicitly ask for a specific piece of information
    const missingFields = this.getMissingMandatoryFields();
    let nextQuestion: OnboardingQuestion | undefined;
    
    if (missingFields.length > 0 && (Math.random() > 0.5 || this.getRemainingTime() < 60)) {
      // Higher chance to directly ask for missing info when time is running out
      const missingField = missingFields[0];
      nextQuestion = this.onboardingQuestions.find(q => q.id === missingField);
    }
    
    return {
      text: aiResponseText,
      nextQuestion: nextQuestion,
      personalityInsight: this.personality,
      suggestedInterests: this.suggestInterests(userInput),
    };
  }

  // Extract profile information from conversation
  private extractProfileInfo(text: string): { 
    questionId?: string; 
    name?: string; 
    age?: number; 
    location?: string;
  } {
    const result: { 
      questionId?: string; 
      name?: string; 
      age?: number; 
      location?: string; 
    } = {};
    
    const lowercaseText = text.toLowerCase();
    
    // Try to extract name (if text contains "my name is" or similar)
    const nameMatch = lowercaseText.match(/(my name is|i am|i'm|call me) (\w+)/i);
    if (nameMatch && nameMatch[2]) {
      result.name = nameMatch[2].charAt(0).toUpperCase() + nameMatch[2].slice(1);
      result.questionId = "q1";
    }
    
    // Try to extract age (any mention of age or years old)
    const ageMatch = lowercaseText.match(/(i am|i'm|my age is) (\d+)( years old)?/i) || 
                    text.match(/(\d+)( years old)/i);
    if (ageMatch && ageMatch[2]) {
      const age = parseInt(ageMatch[2]);
      if (age > 0 && age < 18) {  // Limit for the app's target audience
        result.age = age;
        result.questionId = "q2";
      }
    }
    
    // Try to extract location (if text contains "i live in" or similar)
    const locationMatch = lowercaseText.match(/(i live in|i'm from|i am from|from) (\w+)/i);
    if (locationMatch && locationMatch[2]) {
      result.location = locationMatch[2].charAt(0).toUpperCase() + locationMatch[2].slice(1);
      result.questionId = "q3";
    }
    
    return result;
  }

  // Generate a conversational response that guides toward missing information
  private generateConversationalResponse(userInput: string, extractedInfo: any): string {
    // Check what information we've extracted and respond accordingly
    if (extractedInfo.name) {
      return `Great to meet you, ${extractedInfo.name}! ${this.getNextConversationPrompt()}`;
    }
    
    if (extractedInfo.age) {
      return `${extractedInfo.age} is a great age! ${this.getNextConversationPrompt()}`;
    }
    
    if (extractedInfo.location) {
      return `${extractedInfo.location} sounds like a cool place! ${this.getNextConversationPrompt()}`;
    }
    
    // If we didn't extract anything specific, give a generic response
    const genericResponses = [
      "That's interesting! Tell me more about yourself.",
      "I'd love to hear more. What about where you're from?",
      "Cool! By the way, how old are you?",
      "Thanks for sharing. I don't think I caught your name?",
      "Interesting! What kinds of things do you enjoy doing for fun?",
      "I'd love to know more about your interests and hobbies."
    ];
    
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  }

  // Get the next conversation prompt based on missing information
  private getNextConversationPrompt(): string {
    const missingFields = this.getMissingMandatoryFields();
    
    if (missingFields.includes("q1")) {
      return "I don't think I caught your name yet. What should I call you?";
    }
    
    if (missingFields.includes("q2")) {
      return "How old are you?";
    }
    
    if (missingFields.includes("q3")) {
      return "Where are you from?";
    }
    
    // If we have all mandatory fields, ask about interests
    return "What kinds of things do you enjoy doing?";
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
