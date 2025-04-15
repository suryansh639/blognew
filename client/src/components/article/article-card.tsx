import { Link } from "wouter";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArticleWithAuthor } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ArticleCardProps {
  article: ArticleWithAuthor;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const { user } = useAuth();
  
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
      queryClient.setQueryData(["/api/articles/featured"], (old: any) =>
        old?.map((a: ArticleWithAuthor) =>
          a.id === article.id ? { ...a, isBookmarked } : a
        )
      );
      
      queryClient.setQueryData(["/api/articles"], (old: any) =>
        old?.map((a: ArticleWithAuthor) =>
          a.id === article.id ? { ...a, isBookmarked } : a
        )
      );
    },
  });
  
  const handleBookmark = () => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    
    bookmarkMutation.mutate();
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
    <article className="bg-white rounded-lg shadow-sm overflow-hidden border border-neutral-200 hover:shadow-md transition-shadow">
      {article.coverImage && (
        <div className="h-48 w-full overflow-hidden">
          <img 
            className="h-full w-full object-cover"
            src={article.coverImage}
            alt={article.title}
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center mb-4">
          <Link href={`/profile/${article.author.id}`}>
            <a className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={article.author.avatarUrl || undefined} alt={article.author.username} />
                <AvatarFallback>{getInitials(article.author)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-neutral-600">
                {article.author.firstName && article.author.lastName
                  ? `${article.author.firstName} ${article.author.lastName}`
                  : article.author.username}
              </span>
            </a>
          </Link>
        </div>
        <Link href={`/article/${article.id}`}>
          <a>
            <h3 className="text-xl font-serif font-bold mb-2 hover:text-primary-500 transition-colors">
              {article.title}
            </h3>
          </a>
        </Link>
        <p className="text-neutral-600 mb-4 line-clamp-3">
          {article.excerpt || article.content.substring(0, 150) + '...'}
        </p>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-neutral-500">
              {article.readTime ? `${article.readTime} min read` : '5 min read'}
            </span>
            <span className="text-sm text-neutral-500">
              {formatDate(article.createdAt)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={article.isBookmarked ? "text-primary-500" : "text-neutral-400 hover:text-primary-500"}
            onClick={handleBookmark}
          >
            {article.isBookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
          </Button>
        </div>
        {article.tags && article.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="bg-primary-50 text-primary-800 hover:bg-primary-100">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
