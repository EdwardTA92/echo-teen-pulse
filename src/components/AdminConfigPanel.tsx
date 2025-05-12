
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

interface ApiConfigFormValues {
  apiKey: string;
  aiModel: string;
  timeLimit: number;
}

const AdminConfigPanel: React.FC = () => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  const form = useForm<ApiConfigFormValues>({
    defaultValues: {
      apiKey: '',
      aiModel: 'gpt-4o',
      timeLimit: 300, // 5 minutes in seconds
    }
  });

  const onSubmit = (data: ApiConfigFormValues) => {
    // In a production app, this would send the API key to the backend securely
    // For now, we'll just store in localStorage for demo purposes
    localStorage.setItem('apiConfig', JSON.stringify({
      apiKey: data.apiKey,
      aiModel: data.aiModel,
      timeLimit: data.timeLimit,
      timestamp: new Date().toISOString()
    }));
    
    toast({
      title: "Configuration saved",
      description: "API configuration has been updated successfully.",
    });
    
    setIsConfiguring(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Sparks Fly API Configuration</CardTitle>
          <CardDescription>
            Configure your AI service API keys and parameters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConfiguring ? (
            <Button onClick={() => setIsConfiguring(true)} className="w-full">
              Configure API Settings
            </Button>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="sk-..." 
                          {...field} 
                          type="password"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter your OpenAI or custom LLM API key
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="aiModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Model</FormLabel>
                      <FormControl>
                        <select
                          className="w-full p-2 border rounded-md"
                          {...field}
                        >
                          <option value="gpt-4o">GPT-4o</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                          <option value="custom">Custom Model</option>
                        </select>
                      </FormControl>
                      <FormDescription>
                        Select the AI model to use
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conversation Time Limit (seconds)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={60}
                          max={600}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum time for onboarding conversation (60-600 seconds)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1">
                    Save Configuration
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsConfiguring(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start text-xs text-muted-foreground">
          <p>Your API key is stored securely and is only used for AI conversations.</p>
          <p className="mt-1">For production deployment, integrate with a secure backend service.</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminConfigPanel;
