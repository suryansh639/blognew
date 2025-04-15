import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserWithStats } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function PopularAuthors() {
  const { user } = useAuth();
  
  const { data: authors, isLoading, error } = useQuery<UserWithStats[]>({
    queryKey: ["/api/authors/popular"],
  });
  
  const followMutation = useMutation({
    mutationFn: async (authorId: number) => {
      const isFollowing = authors?.find(a => a.id === authorId)?.isFollowing;
      
      if (isFollowing) {
        const res = await apiRequest("DELETE", `/api/users/${authorId}/follow`);
        return {
          data: await res.json(),
          authorId,
          follow: false
        };
      } else {
        const res = await apiRequest("POST", `/api/users/${authorId}/follow`);
        return {
          data: await res.json(),
          authorId,
          follow: true
        };
      }
    },
    onSuccess: ({ authorId, follow }) => {
      queryClient.setQueryData(["/api/authors/popular"], (old: any) =>
        old?.map((author: UserWithStats) =>
          author.id === authorId 
            ? { ...author, isFollowing: follow } 
            : author
        )
      );
    },
  });
  
  const handleFollow = (authorId: number) => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    
    followMutation.mutate(authorId);
  };
  
  const getInitials = (author: any) => {
    if (!author) return "U";
    if (author.firstName && author.lastName) {
      return `${author.firstName[0]}${author.lastName[0]}`;
    }
    return author.username ? author.username[0].toUpperCase() : "U";
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-neutral-200 mb-8">
        <h3 className="text-lg font-serif font-bold mb-4 text-neutral-900">Popular Authors</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full mr-3" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border border-neutral-200 mb-8">
        <h3 className="text-lg font-serif font-bold mb-4 text-neutral-900">Popular Authors</h3>
        <div className="text-center text-red-500 py-4">
          Error loading authors. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-neutral-200 mb-8">
      <h3 className="text-lg font-serif font-bold mb-4 text-neutral-900">Popular Authors</h3>
      <div className="space-y-4">
        {authors && authors.map((author) => (
          <div key={author.id} className="flex items-center justify-between">
            <Link href={`/profile/${author.id}`}>
              <a className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={author.avatarUrl || undefined} alt={author.username} />
                  <AvatarFallback>{getInitials(author)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-medium text-neutral-900">
                    {author.firstName && author.lastName
                      ? `${author.firstName} ${author.lastName}`
                      : author.username}
                  </h4>
                  <p className="text-xs text-neutral-500">
                    {author.bio ? author.bio.substring(0, 30) + (author.bio.length > 30 ? '...' : '') : 'Writer at Blog Company'}
                  </p>
                </div>
              </a>
            </Link>
            {user && user.id !== author.id && (
              <Button
                variant={author.isFollowing ? "secondary" : "outline"}
                size="sm"
                className={author.isFollowing 
                  ? "text-neutral-700 rounded-full" 
                  : "text-primary-500 border-primary-500 rounded-full hover:bg-primary-50"
                }
                onClick={() => handleFollow(author.id)}
              >
                {author.isFollowing ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        ))}
        
        {authors && authors.length === 0 && (
          <div className="text-center py-4 text-neutral-500">
            No authors found
          </div>
        )}
        
        <Link href="/">
          <a className="text-primary-500 hover:text-primary-600 text-sm font-medium block text-center mt-4">
            View all authors
          </a>
        </Link>
      </div>
    </div>
  );
}
