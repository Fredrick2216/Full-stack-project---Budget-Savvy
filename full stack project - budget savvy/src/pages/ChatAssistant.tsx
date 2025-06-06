
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AIChatbot from "@/components/AIChatbot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ChatAssistant = () => {
  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold nebula-text">Financial Assistant</h1>
        
        <Card className="cosmic-card h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)]">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <span>AI Financial Assistant</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-60px)] sm:h-[calc(100%-80px)] p-4 sm:p-6 pt-0">
            <AIChatbot />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ChatAssistant;
