
// Configuration service for managing API keys and AI settings

interface ApiConfig {
  apiKey: string;
  aiModel: string;
  timeLimit: number;
  timestamp: string;
}

class ConfigService {
  private apiConfig: ApiConfig | null = null;
  
  constructor() {
    this.loadConfig();
  }
  
  private loadConfig(): void {
    if (typeof window !== "undefined") {
      const storedConfig = localStorage.getItem('apiConfig');
      if (storedConfig) {
        try {
          this.apiConfig = JSON.parse(storedConfig);
          console.log("Configuration loaded successfully");
        } catch (err) {
          console.error("Error parsing stored configuration:", err);
          this.apiConfig = null;
        }
      }
    }
  }
  
  public getApiKey(): string | null {
    return this.apiConfig?.apiKey || null;
  }
  
  public getAiModel(): string {
    return this.apiConfig?.aiModel || 'gpt-4o';
  }
  
  public getTimeLimit(): number {
    return this.apiConfig?.timeLimit || 300; // Default 5 minutes
  }
  
  public isConfigured(): boolean {
    return !!this.apiConfig?.apiKey;
  }
  
  public saveConfig(config: Omit<ApiConfig, 'timestamp'>): void {
    this.apiConfig = {
      ...config,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('apiConfig', JSON.stringify(this.apiConfig));
    console.log("Configuration saved successfully");
  }
  
  public clearConfig(): void {
    localStorage.removeItem('apiConfig');
    this.apiConfig = null;
    console.log("Configuration cleared");
  }
}

export default new ConfigService();
