import { Link } from "wouter";
import { Heart, MessageSquare, Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArticleWithAuthor } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ArticleListItemProps {
  article: ArticleWithAuthor;
}

export default function ArticleListItem({ article }: ArticleListItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
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
      queryClient.setQueryData(["/api/articles"], (old: any) =>
        old?.map((a: ArticleWithAuthor) =>
          a.id === article.id 
            ? { 
                ...a, 
                isLiked: data.liked,
                _count: {
                  ...a._count,
                  likes: data.likeCount
                }
              } 
            : a
        )
      );
    },
  });
  
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
      queryClient.setQueryData(["/api/articles"], (old: any) =>
        old?.map((a: ArticleWithAuthor) =>
          a.id === article.id ? { ...a, isBookmarked } : a
        )
      );
    },
  });
  
  const handleLike = () => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    
    likeMutation.mutate();
  };
  
  const handleBookmark = () => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    
    bookmarkMutation.mutate();
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/article/${article.id}`);
    toast({
      title: "Link copied",
      description: "Article link copied to clipboard",
    });
  };
  
  const getInitials = (author: any) => {
    if (!author) return "U";
    if (author.firstName && author.lastName) {
      return `${author.firstName[0]}${author.lastName[0]}`;
    }
    return author.username ? author.username[0].toUpperCase() : "U";
  };
  
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <article className="pb-10 mb-10 border-b border-neutral-200">
      <div className="flex items-center mb-4">
        <Link href={`/profile/${article.author.id}`}>
          <a className="flex items-center">
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
          </a>
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row">
        <div className="md:flex-1 md:pr-8">
          <Link href={`/article/${article.id}`}>
            <a>
              <h2 className="text-2xl font-serif font-bold mb-3 text-neutral-900 hover:text-primary-500 transition-colors">
                {article.title}
              </h2>
            </a>
          </Link>
          <p className="text-neutral-600 mb-4">
            {article.excerpt || article.content.substring(0, 200) + '...'}
          </p>
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="bg-primary-50 text-primary-800 hover:bg-primary-100">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center text-neutral-500 text-sm space-x-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center p-0 hover:text-primary-500 ${article.isLiked ? 'text-primary-500' : ''}`}
              onClick={handleLike}
            >
              <Heart className={`h-5 w-5 mr-1 ${article.isLiked ? 'fill-current' : ''}`} />
              <span>{article._count?.likes || 0}</span>
            </Button>
            <Link href={`/article/${article.id}#comments`}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center p-0 hover:text-primary-500"
              >
                <MessageSquare className="h-5 w-5 mr-1" />
                <span>{article._count?.comments || 0}</span>
              </Button>
            </Link>
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
        {article.coverImage && (
          <div className="md:w-1/3 mt-4 md:mt-0">
            <Link href={`/article/${article.id}`}>
              <a>
                <img 
                  className="w-full h-48 object-cover rounded"
                  src={article.coverImage}
                  alt={article.title}
                />
              </a>
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
