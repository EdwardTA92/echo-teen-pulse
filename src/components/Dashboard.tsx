
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/context/AppContext";
import { User } from "@/types";

// Mock data for suggested connections
const mockConnections: User[] = [
  {
    id: "user1",
    name: "Alex",
    age: 16,
    location: "New York",
    bio: "Music lover, basketball player",
    interests: ["music", "basketball", "travel"],
    profileImage: "/placeholder.svg",
    personality: {
      openness: 0.7,
      conscientiousness: 0.5,
      extraversion: 0.8,
      agreeableness: 0.6,
      neuroticism: 0.3,
      communicationStyle: "expressive",
    },
  },
  {
    id: "user2",
    name: "Taylor",
    age: 17,
    location: "Los Angeles",
    bio: "Artist and gamer",
    interests: ["art", "gaming", "movies"],
    profileImage: "/placeholder.svg",
    personality: {
      openness: 0.8,
      conscientiousness: 0.4,
      extraversion: 0.5,
      agreeableness: 0.7,
      neuroticism: 0.4,
      communicationStyle: "analytical",
    },
  },
  {
    id: "user3",
    name: "Jordan",
    age: 16,
    location: "Chicago",
    bio: "Bookworm and music enthusiast",
    interests: ["reading", "music", "photography"],
    profileImage: "/placeholder.svg",
    personality: {
      openness: 0.6,
      conscientiousness: 0.7,
      extraversion: 0.4,
      agreeableness: 0.8,
      neuroticism: 0.5,
      communicationStyle: "thoughtful",
    },
  },
  {
    id: "user4",
    name: "Riley",
    age: 15,
    location: "Seattle",
    bio: "Loves hiking and video games",
    interests: ["hiking", "gaming", "travel"],
    profileImage: "/placeholder.svg",
    personality: {
      openness: 0.6,
      conscientiousness: 0.5,
      extraversion: 0.6,
      agreeableness: 0.7,
      neuroticism: 0.4,
      communicationStyle: "balanced",
    },
  },
];

const Dashboard: React.FC = () => {
  const { currentUser, logoutUser } = useAppContext();
  const [connections, setConnections] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to get connections
    setTimeout(() => {
      // Filter connections based on interests similarity - simple algorithm
      const suggestedConnections = mockConnections.filter(conn => {
        if (!currentUser || !currentUser.interests) return true;
        
        // Find common interests
        const commonInterests = conn.interests.filter(interest => 
          currentUser.interests.includes(interest)
        );
        
        // At least one common interest
        return commonInterests.length > 0;
      });
      
      setConnections(suggestedConnections);
      setLoading(false);
    }, 1500);
  }, [currentUser]);

  if (!currentUser) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Connect</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold">{currentUser.name}</p>
            <p className="text-sm text-muted-foreground">{currentUser.location}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            {currentUser.name[0]}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="w-full max-w-md mx-auto mb-6 grid grid-cols-3">
            <TabsTrigger value="discover" className="rounded-lg">Discover</TabsTrigger>
            <TabsTrigger value="messages" className="rounded-lg">Messages</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg">Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="discover" className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-4">Discover New Friends</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array(3).fill(0).map((_, index) => (
                  <Card key={index} className="p-6 h-64 animate-pulse-soft">
                    <div className="flex justify-center">
                      <div className="w-20 h-20 bg-muted rounded-full"></div>
                    </div>
                    <div className="h-4 bg-muted rounded mt-4 w-3/4 mx-auto"></div>
                    <div className="h-3 bg-muted rounded mt-2 w-1/2 mx-auto"></div>
                    <div className="h-3 bg-muted rounded mt-2 w-2/3 mx-auto"></div>
                    <div className="flex justify-center mt-4 gap-2">
                      <div className="h-8 bg-muted rounded w-20"></div>
                      <div className="h-8 bg-muted rounded w-20"></div>
                    </div>
                  </Card>
                ))
              ) : connections.length === 0 ? (
                <div className="col-span-full text-center py-10">
                  <p className="text-muted-foreground">No connections found. Try updating your interests.</p>
                </div>
              ) : (
                connections.map((connection) => (
                  <Card key={connection.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6 flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-primary/20 mb-4 flex items-center justify-center text-xl font-bold">
                        {connection.name[0]}
                      </div>
                      
                      <h3 className="font-bold text-lg">{connection.name}, {connection.age}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{connection.location}</p>
                      <p className="text-center text-sm mb-4">{connection.bio}</p>
                      
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        {connection.interests.map((interest, index) => (
                          <span 
                            key={index} 
                            className="text-xs px-3 py-1 bg-secondary rounded-full"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" className="interactive-element">Pass</Button>
                        <Button size="sm" className="interactive-element">Connect</Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="messages">
            <h2 className="text-2xl font-bold mb-4">Messages</h2>
            <Card className="p-8 text-center">
              <p className="mb-4">Start a conversation with your new connections!</p>
              <Button disabled>Coming Soon</Button>
            </Card>
          </TabsContent>
          
          <TabsContent value="profile">
            <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
            <Card className="p-6 max-w-md mx-auto">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-primary/20 mb-4 flex items-center justify-center text-2xl font-bold">
                  {currentUser.name[0]}
                </div>
                <h3 className="text-xl font-bold">{currentUser.name}, {currentUser.age}</h3>
                <p className="text-muted-foreground">{currentUser.location}</p>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Bio</h4>
                <p>{currentUser.bio}</p>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {currentUser.interests.map((interest, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-secondary rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={logoutUser}
              >
                Sign Out
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
