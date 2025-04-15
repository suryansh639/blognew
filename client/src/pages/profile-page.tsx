import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ArticleListItem from "@/components/article/article-list-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserWithStats, ArticleWithAuthor } from "@shared/schema";
import { Cog, Settings } from "lucide-react";

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("articles");
  
  // Get profile user data
  const { data: profileUser, isLoading: isProfileLoading, error: profileError } = useQuery<UserWithStats>({
    queryKey: [`/api/users/${params.id}`],
    enabled: !!params.id,
  });
  
  // Get user's articles
  const { data: userArticles, isLoading: areArticlesLoading, error: articlesError } = useQuery<ArticleWithAuthor[]>({
    queryKey: ["/api/articles", { authorId: parseInt(params.id) }],
    enabled: !!params.id,
    queryFn: async () => {
      const res = await fetch(`/api/articles?authorId=${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch articles");
      return res.json();
    },
  });
  
  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (profileUser?.isFollowing) {
        const res = await apiRequest("DELETE", `/api/users/${params.id}/follow`);
        return await res.json();
      } else {
        const res = await apiRequest("POST", `/api/users/${params.id}/follow`);
        return await res.json();
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`/api/users/${params.id}`], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isFollowing: data.following,
          _count: {
            ...oldData._count,
            followers: data.followerCount
          }
        };
      });
      
      toast({
        title: data.following ? "Following" : "Unfollowed",
        description: data.following 
          ? `You are now following ${profileUser?.username}` 
          : `You are no longer following ${profileUser?.username}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleFollow = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    followMutation.mutate();
  };
  
  const getInitials = (user: any) => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    return user.username ? user.username[0].toUpperCase() : "U";
  };
  
  // Loading state
  if (isProfileLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow bg-white">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="flex-1 text-center md:text-left">
                  <Skeleton className="h-8 w-48 mb-2 mx-auto md:mx-0" />
                  <Skeleton className="h-5 w-32 mb-2 mx-auto md:mx-0" />
                  <Skeleton className="h-4 w-full max-w-lg mb-4" />
                  <div className="flex gap-4 justify-center md:justify-start">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              </div>
              
              <Skeleton className="h-12 w-full mb-8" />
              
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Error state
  if (profileError) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Profile</h1>
            <p className="text-neutral-600 mb-6">
              There was a problem loading this user profile. The user may not exist or the profile may be private.
            </p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // If profile doesn't exist
  if (!profileUser) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-neutral-800 mb-4">User Not Found</h1>
            <p className="text-neutral-600 mb-6">
              The user profile you're looking for doesn't exist.
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
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-12">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profileUser.avatarUrl || undefined} alt={profileUser.username} />
                <AvatarFallback className="text-3xl">{getInitials(profileUser)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-neutral-900 mb-1">
                  {profileUser.firstName && profileUser.lastName
                    ? `${profileUser.firstName} ${profileUser.lastName}`
                    : profileUser.username}
                </h1>
                <h2 className="text-lg text-neutral-600 mb-2">@{profileUser.username}</h2>
                
                {profileUser.bio && (
                  <p className="text-neutral-700 mb-4 max-w-lg">{profileUser.bio}</p>
                )}
                
                <div className="flex gap-6 justify-center md:justify-start mb-4">
                  <div className="text-center">
                    <span className="block font-bold text-neutral-900">{profileUser._count?.articles || 0}</span>
                    <span className="text-sm text-neutral-600">Articles</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-neutral-900">{profileUser._count?.followers || 0}</span>
                    <span className="text-sm text-neutral-600">Followers</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-neutral-900">{profileUser._count?.following || 0}</span>
                    <span className="text-sm text-neutral-600">Following</span>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-center md:justify-start">
                  {user && user.id === parseInt(params.id) ? (
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => navigate("/settings")}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </Button>
                  ) : (
                    <Button 
                      variant={profileUser.isFollowing ? "secondary" : "default"}
                      className={profileUser.isFollowing ? "" : "bg-primary-500 hover:bg-primary-600"}
                      onClick={handleFollow}
                      disabled={followMutation.isPending}
                    >
                      {followMutation.isPending 
                        ? "Processing..." 
                        : profileUser.isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Profile Content Tabs */}
            <Tabs defaultValue="articles" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-8">
                <TabsTrigger value="articles">Articles</TabsTrigger>
                <TabsTrigger value="likes">Likes</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>
              
              <TabsContent value="articles">
                {areArticlesLoading ? (
                  <div className="space-y-8">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="pb-10 mb-10 border-b border-neutral-200">
                        <div className="flex flex-col md:flex-row">
                          <div className="md:flex-1 md:pr-8">
                            <Skeleton className="h-8 w-full mb-2" />
                            <Skeleton className="h-8 w-2/3 mb-4" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-3/4 mb-4" />
                            <div className="flex items-center space-x-6">
                              <Skeleton className="h-8 w-16" />
                              <Skeleton className="h-8 w-16" />
                              <Skeleton className="h-8 w-8" />
                              <Skeleton className="h-8 w-8" />
                            </div>
                          </div>
                          <div className="md:w-1/3 mt-4 md:mt-0">
                            <Skeleton className="w-full h-48 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : articlesError ? (
                  <div className="text-center py-10 bg-red-50 rounded-md">
                    <p className="text-red-500">Error loading articles. Please try again later.</p>
                  </div>
                ) : userArticles && userArticles.length > 0 ? (
                  <div>
                    {userArticles.map(article => (
                      <ArticleListItem key={article.id} article={article} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-neutral-50 rounded-md">
                    <p className="text-neutral-600">No articles published yet.</p>
                    {user && user.id === parseInt(params.id) && (
                      <Button 
                        className="mt-4 bg-primary-500 hover:bg-primary-600"
                        onClick={() => navigate("/create-article")}
                      >
                        Write Your First Article
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="likes">
                <div className="text-center py-10 bg-neutral-50 rounded-md">
                  <p className="text-neutral-600">Liked articles will appear here.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="about">
                <div className="bg-white rounded-lg p-6 border border-neutral-200">
                  <h2 className="text-xl font-bold text-neutral-900 mb-4">About {profileUser.username}</h2>
                  
                  {profileUser.bio ? (
                    <p className="text-neutral-700 mb-6">{profileUser.bio}</p>
                  ) : (
                    <p className="text-neutral-500 italic mb-6">No bio provided.</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Username</h3>
                      <p className="text-neutral-900">@{profileUser.username}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Member Since</h3>
                      <p className="text-neutral-900">January 2023</p>
                    </div>
                    
                    {profileUser.firstName && (
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-1">First Name</h3>
                        <p className="text-neutral-900">{profileUser.firstName}</p>
                      </div>
                    )}
                    
                    {profileUser.lastName && (
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-1">Last Name</h3>
                        <p className="text-neutral-900">{profileUser.lastName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
