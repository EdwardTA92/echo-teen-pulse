
import React, { createContext, useState, useContext, ReactNode } from "react";
import { User, PersonalityTraits } from "../types";

interface AppContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  isOnboarding: boolean;
  onboardingStep: number;
  voiceEnabled: boolean;
  loginUser: (user: User) => void;
  logoutUser: () => void;
  updateUser: (updates: Partial<User>) => void;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  setOnboardingStep: (step: number) => void;
  toggleVoice: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const loginUser = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  const updateUser = (updates: Partial<User>) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...updates });
    }
  };

  const startOnboarding = () => {
    setIsOnboarding(true);
    setOnboardingStep(0);
  };

  const completeOnboarding = () => {
    setIsOnboarding(false);
    setOnboardingStep(0);
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        isOnboarding,
        onboardingStep,
        voiceEnabled,
        loginUser,
        logoutUser,
        updateUser,
        startOnboarding,
        completeOnboarding,
        setOnboardingStep,
        toggleVoice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
