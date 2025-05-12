
import configService from './configService';

// AI Connector Service for connecting to external AI APIs
class AiConnectorService {
  private isReady = false;
  
  constructor() {
    this.checkConfiguration();
  }
  
  private checkConfiguration(): void {
    this.isReady = configService.isConfigured();
  }
  
  // Process text with the AI service
  public async processText(prompt: string, context?: string): Promise<string> {
    this.checkConfiguration();
    
    if (!this.isReady) {
      console.warn("AI service not configured. Please add API key.");
      return "AI service not configured. Please add an API key in the admin panel.";
    }
    
    const apiKey = configService.getApiKey();
    const model = configService.getAiModel();
    
    try {
      // This is a simplified example - in production, use a secure backend endpoint
      // to make this API call rather than exposing the API key in frontend code
      
      // For OpenAI
      if (model.includes('gpt')) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: 'You are a friendly assistant helping onboard teenagers to a social app called Sparks Fly. Keep responses conversational, age-appropriate, and helpful.' },
              ...(context ? [{ role: 'system', content: `Context: ${context}` }] : []),
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 150
          })
        });
        
        const data = await response.json();
        
        if (data.error) {
          console.error("AI API error:", data.error);
          return "Sorry, there was an error processing your request.";
        }
        
        return data.choices[0].message.content;
      }
      
      // For Claude
      if (model.includes('claude')) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            system: 'You are a friendly assistant helping onboard teenagers to a social app called Sparks Fly. Keep responses conversational, age-appropriate, and helpful.',
            messages: [
              { role: 'user', content: `${context ? 'Context: ' + context + '\n\n' : ''}${prompt}` }
            ],
            max_tokens: 150
          })
        });
        
        const data = await response.json();
        
        if (data.error) {
          console.error("AI API error:", data.error);
          return "Sorry, there was an error processing your request.";
        }
        
        return data.content[0].text;
      }
      
      // Default fallback
      return "This AI model is not yet supported. Please select a different model.";
      
    } catch (error) {
      console.error("Error calling AI API:", error);
      return "There was an error connecting to the AI service. Please check your internet connection and API key.";
    }
  }
  
  // Process audio with the AI service - this would connect to a speech-to-text API
  // In a real implementation, this would stream audio to an API endpoint
  public async processAudio(audioBlob: Blob): Promise<string> {
    // This is a placeholder - in a real implementation you would:
    // 1. Upload the audio to an API endpoint
    // 2. Process with Whisper API or similar
    // 3. Return the transcription
    
    return "Audio processing requires backend integration.";
  }
}

export default new AiConnectorService();
