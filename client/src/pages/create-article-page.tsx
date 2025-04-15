import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Editor from "@/components/article/editor";

export default function CreateArticlePage() {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createArticleMutation = useMutation({
    mutationFn: async (articleData: any) => {
      const res = await apiRequest("POST", "/api/articles", articleData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Article created!",
        description: "Your article has been successfully published.",
      });
      navigate(`/article/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create article",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  const handleSubmit = (formData: any) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to publish an article.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    setIsSubmitting(true);
    
    // Process tags if they exist
    const articleData = {
      ...formData,
      authorId: user.id,
    };
    
    createArticleMutation.mutate(articleData);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-2">Create New Article</h1>
            <p className="text-neutral-600">Share your knowledge and experience with the community</p>
          </div>
          
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <Editor 
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
