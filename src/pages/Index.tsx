
import React from "react";
import { AppProvider } from "@/context/AppContext";
import WelcomeScreen from "@/components/WelcomeScreen";
import VoiceOnboarding from "@/components/VoiceOnboarding";
import Dashboard from "@/components/Dashboard";
import { useAppContext } from "@/context/AppContext";

// Main App component that handles routing between views
const AppContent: React.FC = () => {
  const { isLoggedIn, isOnboarding } = useAppContext();

  // Render the appropriate screen based on app state
  if (isOnboarding) {
    return <VoiceOnboarding />;
  }
  
  if (isLoggedIn) {
    return <Dashboard />;
  }
  
  return <WelcomeScreen />;
};

// Root component with context provider
const Index: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default Index;
