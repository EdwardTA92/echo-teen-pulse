
// Basic voice service using Web Speech API

class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isInitialized = false;
  private isRecording = false;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private language = "en-US";

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window !== "undefined") {
      try {
        // Speech recognition setup
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
          this.recognition = new SpeechRecognition();
          this.recognition.continuous = false;
          this.recognition.interimResults = true;
          this.recognition.lang = this.language;
        }

        // Speech synthesis setup
        if (window.speechSynthesis) {
          this.synthesis = window.speechSynthesis;
          this.loadVoices();
          window.speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
        }

        this.isInitialized = Boolean(this.recognition && this.synthesis);
        console.log("Voice service initialized:", this.isInitialized);
      } catch (err) {
        console.error("Error initializing voice service:", err);
      }
    }
  }

  private loadVoices(): void {
    if (this.synthesis) {
      this.voices = this.synthesis.getVoices();
      // Try to find a female voice for English
      this.selectedVoice = this.voices.find(
        (voice) => voice.lang.includes("en-") && voice.name.includes("Female")
      ) || this.voices.find((voice) => voice.lang.includes("en-")) || null;
      
      console.log("Loaded voices:", this.voices.length);
      console.log("Selected voice:", this.selectedVoice?.name);
    }
  }

  public setLanguage(language: string): void {
    this.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }

    // Update selected voice based on language
    if (language === "fr-FR") {
      this.selectedVoice = this.voices.find(
        (voice) => voice.lang.includes("fr-") && voice.name.includes("Female")
      ) || this.voices.find((voice) => voice.lang.includes("fr-")) || this.selectedVoice;
    } else {
      this.selectedVoice = this.voices.find(
        (voice) => voice.lang.includes("en-") && voice.name.includes("Female")
      ) || this.voices.find((voice) => voice.lang.includes("en-")) || this.selectedVoice;
    }
  }

  public async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis || !this.isInitialized) {
        console.warn("Speech synthesis not supported");
        reject("Speech synthesis not supported");
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        reject(event);
      };
      
      this.synthesis.speak(utterance);
    });
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: any) => void
  ): void {
    if (!this.recognition || !this.isInitialized) {
      console.warn("Speech recognition not supported");
      onError("Speech recognition not supported");
      return;
    }

    if (this.isRecording) {
      this.stopListening();
    }

    this.isRecording = true;

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      const isFinal = event.results[0].isFinal;
      onResult(transcript, isFinal);
    };

    this.recognition.onerror = (event) => {
      console.error("Speech recognition error:", event);
      onError(event);
      this.isRecording = false;
    };

    this.recognition.onend = () => {
      this.isRecording = false;
    };

    try {
      this.recognition.start();
      console.log("Speech recognition started");
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      onError(error);
      this.isRecording = false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isRecording) {
      try {
        this.recognition.stop();
        console.log("Speech recognition stopped");
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
      this.isRecording = false;
    }
  }

  public isSupported(): boolean {
    return this.isInitialized;
  }
}

export default new VoiceService();
