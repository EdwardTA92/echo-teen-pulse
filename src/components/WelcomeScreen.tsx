
import React from "react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";

const WelcomeScreen: React.FC = () => {
  const { startOnboarding } = useAppContext();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute w-64 h-64 rounded-full bg-app-purple/20 blur-3xl -top-10 -left-10 animate-float-subtle" />
      <div className="absolute w-72 h-72 rounded-full bg-app-pink/20 blur-3xl -bottom-10 -right-10 animate-float-subtle" style={{ animationDelay: "1s" }} />
      
      <div className="z-10 text-center">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold mb-2 text-gradient">Connect</h1>
          <p className="text-xl text-muted-foreground">
            Meet new friends in a whole new way
          </p>
        </div>

        <div className="glass-card p-8 rounded-2xl max-w-md animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-2xl font-bold mb-4">Ready to Connect?</h2>
          <p className="mb-6 text-muted-foreground">
            Our AI will guide you through creating your profile. We'll get to know you through a friendly conversation.
          </p>
          
          <Button 
            onClick={startOnboarding}
            className="w-full py-6 text-lg bg-purple-gradient hover:opacity-90 transition-all interactive-element"
          >
            Start with Voice Chat
          </Button>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Takes less than 5 minutes to set up
          </div>
        </div>
      </div>
      
      <footer className="fixed bottom-4 text-sm text-muted-foreground">
        For users 17 and under • Connect responsibly
      </footer>
    </div>
  );
};

export default WelcomeScreen;
