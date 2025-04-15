import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Heart, MessageCircle, Bookmark, BookmarkCheck, Share2, Edit, Trash2 } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ArticlePage() {
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Get article by id
  const { data: article, isLoading: isArticleLoading, error: articleError } = useQuery({
    queryKey: [`/api/articles/${params.id}`],
    enabled: !!params.id,
  });

  // Get comments for this article
  const { data: comments, isLoading: areCommentsLoading, error: commentsError } = useQuery({
    queryKey: [`/api/articles/${params.id}/comments`],
    enabled: !!params.id,
  });

  // Handle like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (article.isLiked) {
        const res = await apiRequest("DELETE", `/api/articles/${article.id}/like`);
        return await res.json();
      } else {
        const res = await apiRequest("POST", `/api/articles/${article.id}/like`);
        return await res.json();
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`/api/articles/${params.id}`], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isLiked: data.liked,
          _count: {
            ...oldData._count,
            likes: data.likeCount
          }
        };
      });
    },
  });

  // Handle bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (article.isBookmarked) {
        await apiRequest("DELETE", `/api/articles/${article.id}/bookmark`);
        return false;
      } else {
        await apiRequest("POST", `/api/articles/${article.id}/bookmark`);
        return true;
      }
    },
    onSuccess: (isBookmarked) => {
      queryClient.setQueryData([`/api/articles/${params.id}`], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isBookmarked
        };
      });
    },
  });

  // Handle comment submission
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/articles/${params.id}/comments`, { content });
      return await res.json();
    },
    onSuccess: (newComment) => {
      queryClient.setQueryData([`/api/articles/${params.id}/comments`], (oldData: any) => {
        if (!oldData) return [newComment];
        return [newComment, ...oldData];
      });
      
      // Increment comment count
      queryClient.setQueryData([`/api/articles/${params.id}`], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          _count: {
            ...oldData._count,
            comments: (oldData._count?.comments || 0) + 1
          }
        };
      });
      
      setComment(""); // Clear comment input
    },
    onError: (error) => {
      toast({
        title: "Failed to post comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle article deletion
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/articles/${params.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Article deleted",
        description: "Your article has been successfully deleted.",
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Failed to delete article",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    likeMutation.mutate();
  };

  const handleBookmark = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    bookmarkMutation.mutate();
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    commentMutation.mutate(comment);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Article link copied to clipboard",
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const getInitials = (user: any) => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    return user.username ? user.username[0].toUpperCase() : "U";
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "MMMM d, yyyy");
  };

  // Loading state
  if (isArticleLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow bg-white">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <div className="flex items-center mb-6">
              <Skeleton className="h-10 w-10 rounded-full mr-3" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-64 w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (articleError) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Article</h1>
            <p className="text-neutral-600 mb-6">
              There was a problem loading this article. It may have been deleted or you may not have permission to view it.
            </p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If article doesn't exist
  if (!article) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-neutral-800 mb-4">Article Not Found</h1>
            <p className="text-neutral-600 mb-6">
              The article you're looking for doesn't exist or has been removed.
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
          {/* Article Header */}
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-6">
            {article.title}
          </h1>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={article.author.avatarUrl || undefined} alt={article.author.username} />
                <AvatarFallback>{getInitials(article.author)}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-sm font-medium text-neutral-900">
                  {article.author.firstName && article.author.lastName
                    ? `${article.author.firstName} ${article.author.lastName}`
                    : article.author.username}
                </h4>
                <div className="flex items-center text-sm text-neutral-500">
                  <span>{formatDate(article.createdAt)}</span>
                  <span className="mx-1">·</span>
                  <span>{article.readTime ? `${article.readTime} min read` : '5 min read'}</span>
                </div>
              </div>
            </div>
            
            {/* Article Actions for Author */}
            {user && user.id === article.author.id && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => navigate(`/edit-article/${article.id}`)}
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
                
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1 text-red-500 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your article and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
          
          {/* Cover Image */}
          {article.coverImage && (
            <div className="mb-8">
              <img 
                src={article.coverImage} 
                alt={article.title} 
                className="w-full h-auto max-h-96 object-cover rounded-lg"
              />
            </div>
          )}
          
          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="outline" 
                  className="bg-primary-50 text-primary-800 hover:bg-primary-100"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Article Content */}
          <div className="prose prose-neutral max-w-none mb-8">
            {article.content.split('\n').map((paragraph, idx) => (
              <p key={idx} className={paragraph.trim() === "" ? "my-4" : ""}>
                {paragraph}
              </p>
            ))}
          </div>
          
          {/* Article Actions */}
          <div className="flex items-center justify-between border-t border-b border-neutral-200 py-4 mb-8">
            <div className="flex items-center space-x-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`flex items-center p-0 hover:text-primary-500 ${article.isLiked ? 'text-primary-500' : ''}`}
                onClick={handleLike}
              >
                <Heart className={`h-5 w-5 mr-1 ${article.isLiked ? 'fill-current' : ''}`} />
                <span>{article._count?.likes || 0}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center p-0 hover:text-primary-500"
                onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <MessageCircle className="h-5 w-5 mr-1" />
                <span>{article._count?.comments || 0}</span>
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className={article.isBookmarked ? "text-primary-500 p-0" : "text-neutral-500 hover:text-primary-500 p-0"}
                onClick={handleBookmark}
              >
                {article.isBookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 hover:text-primary-500"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Author Info Card */}
          <Card className="mb-12 border border-neutral-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarImage src={article.author.avatarUrl || undefined} alt={article.author.username} />
                  <AvatarFallback>{getInitials(article.author)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">
                    {article.author.firstName && article.author.lastName
                      ? `${article.author.firstName} ${article.author.lastName}`
                      : article.author.username}
                  </h3>
                  {article.author.bio && (
                    <p className="text-neutral-600 text-sm mt-1">{article.author.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-neutral-50 px-6 py-3">
              <Button 
                variant="outline" 
                className="text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                onClick={() => navigate(`/profile/${article.author.id}`)}
              >
                View Profile
              </Button>
            </CardFooter>
          </Card>
          
          {/* Comments Section */}
          <div id="comments" className="scroll-mt-20">
            <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-6">
              Comments ({article._count?.comments || 0})
            </h2>
            
            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 mt-1">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <Textarea 
                      placeholder="Add a comment..." 
                      className="min-h-24 mb-2 resize-none"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <Button 
                      type="submit" 
                      disabled={!comment.trim() || commentMutation.isPending}
                    >
                      {commentMutation.isPending ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-neutral-50 p-4 rounded-md text-center mb-8">
                <p className="text-neutral-600 mb-2">Sign in to leave a comment</p>
                <Button onClick={() => navigate("/auth")}>Sign In</Button>
              </div>
            )}
            
            {/* Comments List */}
            {areCommentsLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full mt-1" />
                    <div className="flex-grow">
                      <Skeleton className="h-4 w-36 mb-2" />
                      <Skeleton className="h-3 w-24 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : commentsError ? (
              <div className="text-center py-6 bg-red-50 rounded-md">
                <p className="text-red-500">Error loading comments. Please try again later.</p>
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b border-neutral-200 pb-6">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 mt-1">
                        <AvatarImage src={comment.author.avatarUrl || undefined} alt={comment.author.username} />
                        <AvatarFallback>{getInitials(comment.author)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-neutral-900">
                            {comment.author.firstName && comment.author.lastName
                              ? `${comment.author.firstName} ${comment.author.lastName}`
                              : comment.author.username}
                          </h4>
                          <span className="text-xs text-neutral-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-neutral-700">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-neutral-50 rounded-md">
                <p className="text-neutral-600">No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
