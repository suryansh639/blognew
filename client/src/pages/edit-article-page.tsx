import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Editor from "@/components/article/editor";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function EditArticlePage() {
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch the article data
  const { data: article, isLoading, error } = useQuery({
    queryKey: [`/api/articles/${params.id}`],
    enabled: !!params.id,
  });
  
  // Check if user is author
  useEffect(() => {
    if (article && user && article.author.id !== user.id) {
      toast({
        title: "Unauthorized",
        description: "You can only edit your own articles.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [article, user, navigate, toast]);
  
  const updateArticleMutation = useMutation({
    mutationFn: async (articleData: any) => {
      const res = await apiRequest("PUT", `/api/articles/${params.id}`, articleData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Article updated!",
        description: "Your article has been successfully updated.",
      });
      navigate(`/article/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update article",
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
        description: "You must be logged in to edit an article.",
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
    
    updateArticleMutation.mutate(articleData);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow bg-white">
          <div className="container mx-auto px-4 py-16 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Article</h1>
            <p className="text-neutral-600 mb-6">
              There was a problem loading this article. It may have been deleted or you may not have permission to edit it.
            </p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!article) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-neutral-800 mb-4">Article Not Found</h1>
            <p className="text-neutral-600 mb-6">
              The article you're trying to edit doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-2">Edit Article</h1>
            <p className="text-neutral-600">Update your article content and details</p>
          </div>
          
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <Editor 
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              defaultValues={{
                title: article.title,
                content: article.content,
                excerpt: article.excerpt,
                readTime: article.readTime,
                coverImage: article.coverImage,
                tags: article.tags,
              }}
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
