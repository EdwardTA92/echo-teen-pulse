
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Volume, VolumeX } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import aiService from "@/services/aiService";
import voiceService from "@/services/voiceService";
import configService from "@/services/configService";
import { AIResponse, OnboardingQuestion } from "@/types";
import { useToast } from "@/hooks/use-toast";

const MAX_RECORDING_TIME = 60; // seconds

const VoiceOnboarding: React.FC = () => {
  const { onboardingStep, setOnboardingStep, completeOnboarding, voiceEnabled, toggleVoice, updateUser } = useAppContext();
  const { toast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState<OnboardingQuestion | null>(null);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTypingResponse, setShowTypingResponse] = useState(false);
  const [typedResponse, setTypedResponse] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [conversationTimeProgress, setConversationTimeProgress] = useState(0);
  const [collectingInfo, setCollectingInfo] = useState({
    name: "",
    age: 0,
    location: "",
    interests: [] as string[],
  });
  const [apiConfigured, setApiConfigured] = useState(false);

  const timerRef = useRef<number | null>(null);
  const conversationTimerRef = useRef<number | null>(null);
  const aiSpeakingRef = useRef(false);
  const maxSteps = 7; // Total number of onboarding steps

  // Check if API is configured
  useEffect(() => {
    const isConfigured = configService.isConfigured();
    setApiConfigured(isConfigured);
    
    if (!isConfigured) {
      toast({
        title: "API not configured",
        description: "For full AI capabilities, an administrator should configure the API key.",
        variant: "default", // Changed from "warning" to "default"
        duration: 6000,
      });
    }
  }, []);

  // Start conversation timer
  useEffect(() => {
    // Start the AI service conversation timer
    aiService.startConversationTimer();
    
    // Update the UI with time progress
    const updateTimeProgress = () => {
      setConversationTimeProgress(aiService.getTimeProgress());
      
      // Check if time expired
      if (aiService.isTimeExpired() && !aiService.areMandatoryFieldsCollected()) {
        toast({
          title: "Time's up!",
          description: "Let's finish setting up your profile with what we know so far.",
          variant: "default", // Changed from "warning" to "default"
        });
        
        // Ensure we have at least some information before completing
        setTimeout(() => {
          handleCompleteOnboarding();
        }, 2000);
      }
    };
    
    // Update progress immediately and then every second
    updateTimeProgress();
    conversationTimerRef.current = setInterval(updateTimeProgress, 1000) as unknown as number;
    
    return () => {
      if (conversationTimerRef.current) {
        clearInterval(conversationTimerRef.current);
      }
    };
  }, []);
  
  // Load the initial question when component mounts
  useEffect(() => {
    const initialQuestion = aiService.getInitialQuestion();
    setCurrentQuestion(initialQuestion);
    speakQuestion(initialQuestion.text);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Update progress bar
  useEffect(() => {
    setProgress((onboardingStep / maxSteps) * 100);
  }, [onboardingStep]);

  // Handle AI response display with typing effect
  useEffect(() => {
    if (aiResponse && showTypingResponse) {
      let index = 0;
      const text = aiResponse.text;
      
      const typing = setInterval(() => {
        if (index < text.length) {
          setTypedResponse(text.substring(0, index + 1));
          index++;
        } else {
          clearInterval(typing);
          
          // If voice is enabled and not currently speaking, speak the response
          if (voiceEnabled && !aiSpeakingRef.current && aiResponse.text) {
            speakAiResponse(aiResponse.text);
          }
        }
      }, 20);
      
      return () => clearInterval(typing);
    }
  }, [aiResponse, showTypingResponse, voiceEnabled]);

  // Speak the question text
  const speakQuestion = async (text: string) => {
    if (voiceEnabled) {
      try {
        aiSpeakingRef.current = true;
        await voiceService.speak(text);
        aiSpeakingRef.current = false;
      } catch (error) {
        console.error("Error speaking question:", error);
        aiSpeakingRef.current = false;
      }
    }
  };

  // Speak the AI response
  const speakAiResponse = async (text: string) => {
    if (voiceEnabled) {
      try {
        aiSpeakingRef.current = true;
        await voiceService.speak(text);
        aiSpeakingRef.current = false;
        
        // After speaking response, if there's a next question, move to it
        if (aiResponse?.nextQuestion) {
          setTimeout(() => {
            setCurrentQuestion(aiResponse.nextQuestion!);
            speakQuestion(aiResponse.nextQuestion!.text);
          }, 1000);
        } else {
          // Check if we've collected all mandatory information or time is up
          if (aiService.areMandatoryFieldsCollected() || aiService.getRemainingTime() < 30) {
            // No more questions or time is almost up, complete onboarding
            handleCompleteOnboarding();
          } else {
            // Continue with open conversation
            setTimeout(() => {
              startListening();
            }, 500);
          }
        }
      } catch (error) {
        console.error("Error speaking response:", error);
        aiSpeakingRef.current = false;
      }
    }
  };

  // Start voice recording
  const startListening = () => {
    if (aiSpeakingRef.current) {
      return; // Don't start listening if AI is speaking
    }

    setIsListening(true);
    setTranscript("");
    setRecordingTime(0);
    
    // Start timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= MAX_RECORDING_TIME) {
          stopListening();
          return MAX_RECORDING_TIME;
        }
        return prev + 1;
      });
    }, 1000) as unknown as number;
    
    // Start voice recognition with continuous mode
    voiceService.setContinuousMode(true);
    voiceService.startListening(
      (text, isFinal) => {
        setTranscript(text);
        if (isFinal && text.trim().length > 5) {
          // Process longer responses immediately
          stopListening();
        }
      },
      (error) => {
        console.error("Voice recognition error:", error);
        toast({
          title: "Voice recognition error",
          description: "Could not understand speech. Please try again or use text input.",
          variant: "destructive",
        });
        stopListening();
      },
      // Silence callback - process after silence
      () => {
        if (transcript.trim().length > 0) {
          stopListening();
        }
      }
    );
  };

  // Stop voice recording
  const stopListening = () => {
    voiceService.stopListening();
    setIsListening(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (transcript && transcript.trim()) {
      processUserResponse(transcript);
    }
  };

  // Process the user's response
  const processUserResponse = async (response: string) => {
    if (!response.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Update our collected info based on the question and response
      updateCollectedInfo(currentQuestion, response);
      
      let aiResp: AIResponse;
      
      // If responding to a specific question
      if (currentQuestion) {
        aiResp = await aiService.processResponse(currentQuestion.text, response);
      } else {
        // Open-ended conversation
        aiResp = await aiService.processConversation(response);
      }
      
      setAiResponse(aiResp);
      setShowTypingResponse(true);
      setTypedResponse("");
      
      // Move to next step if we have a structured question
      if (currentQuestion) {
        setOnboardingStep(onboardingStep + 1);
      }
      
    } catch (error) {
      console.error("Error processing response:", error);
      toast({
        title: "Processing error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Update our collected information based on the response
  const updateCollectedInfo = (question: OnboardingQuestion | null, response: string) => {
    // If no specific question, we'll have to manually extract information
    if (!question) {
      // Use simple extraction logic instead of calling the private method
      const extractedInfo = extractProfileInfo(response);
      
      if (extractedInfo.name) {
        setCollectingInfo(prev => ({ ...prev, name: extractedInfo.name }));
      }
      if (extractedInfo.age) {
        setCollectingInfo(prev => ({ ...prev, age: extractedInfo.age }));
      }
      if (extractedInfo.location) {
        setCollectingInfo(prev => ({ ...prev, location: extractedInfo.location }));
      }
      return;
    }
    
    // Very basic info extraction for specific questions
    const questionId = question.id;
    
    if (questionId === "q1") {
      setCollectingInfo(prev => ({ ...prev, name: response }));
    } else if (questionId === "q2") {
      const age = parseInt(response.match(/\d+/)?.[0] || "0");
      setCollectingInfo(prev => ({ ...prev, age }));
    } else if (questionId === "q3") {
      setCollectingInfo(prev => ({ ...prev, location: response }));
    } else if (questionId === "q4" || questionId === "q5") {
      // Extract potential interests
      const keywords = response.toLowerCase().split(/\s+/);
      const commonInterests = ["music", "sports", "travel", "reading", "gaming", "movies", "art"];
      
      const foundInterests = commonInterests.filter(interest => 
        keywords.some(word => word.includes(interest))
      );
      
      if (foundInterests.length) {
        setCollectingInfo(prev => ({
          ...prev, 
          interests: [...new Set([...prev.interests, ...foundInterests])]
        }));
      }
    }
  };

  // Simple profile info extraction function since we can't access the private method in aiService
  const extractProfileInfo = (text: string): { name?: string; age?: number; location?: string } => {
    const result: { name?: string; age?: number; location?: string } = {};
    
    const lowercaseText = text.toLowerCase();
    
    // Try to extract name (if text contains "my name is" or similar)
    const nameMatch = lowercaseText.match(/(my name is|i am|i'm|call me) (\w+)/i);
    if (nameMatch && nameMatch[2]) {
      result.name = nameMatch[2].charAt(0).toUpperCase() + nameMatch[2].slice(1);
    }
    
    // Try to extract age (any mention of age or years old)
    const ageMatch = lowercaseText.match(/(i am|i'm|my age is) (\d+)( years old)?/i) || 
                    text.match(/(\d+)( years old)/i);
    if (ageMatch && ageMatch[2]) {
      const age = parseInt(ageMatch[2]);
      if (age > 0 && age < 18) {  // Limit for the app's target audience
        result.age = age;
      }
    }
    
    // Try to extract location (if text contains "i live in" or similar)
    const locationMatch = lowercaseText.match(/(i live in|i'm from|i am from|from) (\w+)/i);
    if (locationMatch && locationMatch[2]) {
      result.location = locationMatch[2].charAt(0).toUpperCase() + locationMatch[2].slice(1);
    }
    
    return result;
  };

  // Handle text input submission
  const handleTextSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (transcript) {
      processUserResponse(transcript);
    }
  };

  // Complete the onboarding process
  const handleCompleteOnboarding = () => {
    // Stop all timers
    if (conversationTimerRef.current) {
      clearInterval(conversationTimerRef.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Create a user from collected information
    const user = {
      id: `user-${Date.now()}`,
      name: collectingInfo.name || "User",
      age: collectingInfo.age || 16,
      location: collectingInfo.location || "Unknown",
      bio: "I'm excited to connect with new friends!",
      interests: collectingInfo.interests.length ? collectingInfo.interests : ["music", "movies", "gaming"],
      profileImage: "/placeholder.svg",
      personality: {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
        communicationStyle: "balanced",
      },
    };
    
    updateUser(user);
    toast({
      title: "Profile created!",
      description: "Your profile has been successfully set up.",
    });
    
    completeOnboarding();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/30">
      {/* Progress indicators */}
      <div className="w-full max-w-3xl mb-2 px-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Profile creation: {onboardingStep}/{maxSteps}</span>
          <span className="text-sm font-medium">{Math.floor((configService.getTimeLimit() - aiService.getRemainingTime()) / 60)}:{(aiService.getRemainingTime() % 60).toString().padStart(2, '0')}</span>
        </div>
        <Progress value={progress} className="h-2 mb-2" />
        <Progress value={conversationTimeProgress} className="h-1 bg-red-100" />
      </div>

      <Card className="w-full max-w-3xl p-6 shadow-lg animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Sparks Fly</h2>
          <div className="flex gap-2">
            {!apiConfigured && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/admin'}
                title="Configure AI API"
                className="text-xs"
              >
                Configure AI
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleVoice} 
              title={voiceEnabled ? "Mute voice" : "Enable voice"}
              className="rounded-full w-10 h-10 p-0"
            >
              {voiceEnabled ? <Volume size={20} /> : <VolumeX size={20} />}
            </Button>
          </div>
        </div>
        
        {/* AI Question */}
        {currentQuestion && (
          <div className="mb-6">
            <div className="bg-secondary/50 rounded-lg p-4 mb-2 animate-fade-in">
              <p className="text-lg">{currentQuestion.text}</p>
            </div>
          </div>
        )}
        
        {/* AI Response */}
        {showTypingResponse && (
          <div className="bg-primary/10 rounded-lg p-4 mb-6 animate-fade-in">
            <p>{typedResponse}</p>
          </div>
        )}
        
        {/* User Input Area */}
        <div className="mt-6">
          {/* Voice input */}
          {(currentQuestion?.responseType === "voice" || !currentQuestion) && (
            <div className="flex flex-col items-center">
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing || aiSpeakingRef.current}
                className={`rounded-full w-16 h-16 p-0 flex items-center justify-center transition-all ${
                  isListening ? "bg-red-500 hover:bg-red-600 scale-110" : "bg-primary"
                }`}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              </Button>
              
              {isListening && (
                <div className="mt-4 text-center animate-pulse-soft">
                  <p>Listening... {Math.round(MAX_RECORDING_TIME - recordingTime)}s</p>
                </div>
              )}
              
              {transcript && (
                <div className="mt-4 p-3 bg-muted rounded-lg w-full">
                  <p className="italic">{transcript}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Text input */}
          {(currentQuestion?.responseType === "text" || !currentQuestion?.responseType) && (
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={isProcessing || isListening}
                placeholder="Type your response..."
                className="flex-1 p-3 rounded-lg border border-input bg-background"
                autoFocus
              />
              <Button 
                type="submit" 
                disabled={isProcessing || !transcript.trim()}
                className="px-6"
              >
                Send
              </Button>
            </form>
          )}
          
          {/* Multiple choice input */}
          {currentQuestion?.responseType === "multiple-choice" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options?.map((option, i) => (
                <Button
                  key={i}
                  onClick={() => processUserResponse(option)}
                  disabled={isProcessing}
                  variant="outline"
                  className="p-4 h-auto text-left justify-start interactive-element"
                >
                  {option}
                </Button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Hint text */}
      <p className="text-sm text-muted-foreground mt-6">
        {isListening 
          ? "Click the microphone again to stop recording when you're finished speaking"
          : aiService.getRemainingTime() < 60
          ? "Time is running out! Please finish your profile quickly."
          : "Click the microphone to start speaking or type your response"}
      </p>
    </div>
  );
};

export default VoiceOnboarding;
