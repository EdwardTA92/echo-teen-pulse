import configService from './configService';
import OpenRouter from 'openrouter';

class AiConnectorService {
  private isReady = false;
  private openRouter: OpenRouter | null = null;
  
  constructor() {
    this.checkConfiguration();
  }
  
  private checkConfiguration(): void {
    this.isReady = configService.isConfigured();
    if (this.isReady) {
      this.openRouter = new OpenRouter({
        apiKey: configService.getApiKey(),
        baseURL: 'https://openrouter.ai/api/v1'
      });
    }
  }
  
  public async processText(prompt: string, context?: string): Promise<string> {
    this.checkConfiguration();
    
    if (!this.isReady || !this.openRouter) {
      console.warn("AI service not configured. Please add API key.");
      return "AI service not configured. Please add an API key in the admin panel.";
    }
    
    try {
      const response = await this.openRouter.chat.completions.create({
        model: configService.getAiModel(),
        messages: [
          { 
            role: 'system', 
            content: 'You are a friendly assistant helping onboard teenagers to a social app called Sparks Fly. Keep responses conversational, age-appropriate, and helpful.' 
          },
          ...(context ? [{ role: 'system', content: `Context: ${context}` }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      });
      
      return response.choices[0].message.content || "I couldn't generate a response. Please try again.";
      
    } catch (error) {
      console.error("Error calling AI API:", error);
      return "There was an error connecting to the AI service. Please check your internet connection and API key.";
    }
  }
  
  public async processAudio(audioBlob: Blob): Promise<string> {
    // This would integrate with a speech-to-text service
    // For now, we'll use the Web Speech API
    return new Promise((resolve, reject) => {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };
      
      recognition.onerror = (event) => {
        reject(event.error);
      };
      
      recognition.start();
    });
  }
}

export default new AiConnectorService();