
import React, { useState, useRef, useEffect } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Send, Bot, Search, X, Clock, Filter, Bookmark, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  category?: string;
};

const AIChatbot: React.FC = () => {
  const { supabase, user } = useSupabase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [historyMessages, setHistoryMessages] = useState<Message[]>([]);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  // Initial welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: "welcome",
      role: "assistant" as const,
      content: "Hello! I'm your AI financial assistant. How can I help you with your financial questions today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get chat history when tab changes
  useEffect(() => {
    if (activeTab === "history" && user) {
      fetchChatHistory();
    }
  }, [activeTab, user, filterCategory]);

  const fetchChatHistory = async (searchTerm: string = searchQuery) => {
    if (!user) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-history', {
        body: {
          action: 'get',
          userId: user.id,
          searchTerm,
          category: filterCategory
        }
      });

      if (error) throw error;
      setHistoryMessages(data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    } catch (error) {
      console.error("Error fetching chat history:", error);
      toast.error("Failed to retrieve chat history");
    } finally {
      setIsSearching(false);
    }
  };

  const saveChatHistory = async (messagesList: Message[]) => {
    if (!user) return;
    
    try {
      await supabase.functions.invoke('chat-history', {
        body: {
          action: 'save',
          userId: user.id,
          messages: messagesList
        }
      });
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  };

  const deleteHistoryMessage = async (messageId: string) => {
    if (!user) return;
    
    try {
      await supabase.functions.invoke('chat-history', {
        body: {
          action: 'delete',
          userId: user.id,
          messageId
        }
      });
      
      // Update local state
      setHistoryMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChatHistory();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Don't proceed if no user is logged in
    if (!user) {
      toast.error("Please log in to use the chatbot");
      return;
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Call the Supabase edge function for OpenAI integration
      const { data, error } = await supabase.functions.invoke('ai-financial-chat', {
        body: {
          query: input,
          chatHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });

      if (error) throw error;

      // Add assistant response to chat
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: data.response,
        timestamp: new Date(),
        category: data.category || "general"
      };
      
      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);
      
      // Save to history
      saveChatHistory([userMessage, assistantMessage]);
    } catch (error) {
      console.error("Error getting chatbot response:", error);
      
      // Add error message
      const errorMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: "Sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Failed to get response from AI assistant");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    const welcomeMessage = {
      id: crypto.randomUUID(),
      role: "assistant" as const,
      content: "Chat cleared. How can I help you today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const handleViewMessageDetails = (message: Message) => {
    setSelectedMessage(message);
    setShowHistoryDialog(true);
  };

  const handleRestoreChat = (message: Message) => {
    // Find related messages from the same conversation
    const timestamp = message.timestamp;
    const timeWindow = 60000; // 1 minute window to group messages
    
    const relatedMessages = historyMessages.filter(msg => {
      const timeDiff = Math.abs(msg.timestamp.getTime() - timestamp.getTime());
      return timeDiff <= timeWindow;
    });
    
    // Sort by timestamp
    const sortedMessages = [...relatedMessages].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    setMessages(sortedMessages);
    setActiveTab("chat");
    toast.success("Chat conversation restored");
  };

  const getCategoryColor = (category: string = "general") => {
    const colors: Record<string, string> = {
      budgeting: "bg-blue-500",
      saving: "bg-green-500",
      investing: "bg-purple-500",
      debt: "bg-red-500",
      general: "bg-gray-500"
    };
    
    return colors[category] || colors.general;
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-2">
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            {activeTab === "chat" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearChat}
                title="Clear chat"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            {activeTab === "history" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-1" />
                    <span>{filterCategory || "All"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background">
                  <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterCategory(null)}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterCategory("budgeting")}>
                    Budgeting
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterCategory("saving")}>
                    Saving
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterCategory("investing")}>
                    Investing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterCategory("debt")}>
                    Debt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterCategory("general")}>
                    General
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        <TabsContent value="chat" className="mt-0 space-y-4 flex-grow h-[calc(100%-50px)] flex flex-col">
          <div className="flex-grow overflow-y-auto px-4 py-2 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <Bot className="h-4 w-4 mr-1" />
                        <span className="text-xs text-muted-foreground">AI Assistant</span>
                      </div>
                      {message.category && (
                        <Badge variant="outline" className="text-xs ml-2">
                          {message.category}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap prose dark:prose-invert max-w-none">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 p-4 border-t"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about budgeting, saving, investing..."
              disabled={loading}
              className="flex-grow"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              {loading ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="history" className="mt-0 space-y-4 flex-grow h-[calc(100%-50px)]">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your chat history..."
              className="flex-grow"
            />
            <Button type="submit" size="icon" disabled={isSearching}>
              {isSearching ? <Spinner className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>
          
          <div className="space-y-4 overflow-y-auto">
            {historyMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-2" />
                <h3 className="font-medium">No chat history found</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "No results match your search" 
                    : "Start a conversation to see your history here"}
                </p>
              </div>
            ) : (
              historyMessages.map((message) => (
                <div 
                  key={message.id} 
                  className={`p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                    message.role === "user" ? "border-l-4 border-primary" : "border-l-4 border-transparent"
                  }`}
                  onClick={() => handleViewMessageDetails(message)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center">
                      {message.role === "user" ? (
                        <span className="font-medium">You</span>
                      ) : (
                        <div className="flex items-center">
                          <Bot className="h-4 w-4 mr-1" />
                          <span>Assistant</span>
                        </div>
                      )}
                      {message.category && (
                        <Badge 
                          className={`ml-2 text-xs ${getCategoryColor(message.category)} text-white`}
                          variant="outline"
                        >
                          {message.category}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm truncate">{message.content}</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Message Detail Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedMessage?.role === "user" ? "Your Message" : (
                <div className="flex items-center">
                  <Bot className="h-4 w-4 mr-1" />
                  <span>AI Assistant</span>
                </div>
              )}
              {selectedMessage?.timestamp && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({new Date(selectedMessage.timestamp).toLocaleString()})
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedMessage?.category && (
                <Badge variant="outline" className="mb-2">
                  {selectedMessage.category}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap prose dark:prose-invert">
            {selectedMessage?.content}
          </div>
          
          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedMessage) deleteHistoryMessage(selectedMessage.id);
                setShowHistoryDialog(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            
            <Button
              onClick={() => {
                if (selectedMessage) handleRestoreChat(selectedMessage);
                setShowHistoryDialog(false);
              }}
              size="sm"
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Restore Chat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIChatbot;
