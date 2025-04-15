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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UserWithStats, ArticleWithAuthor } from "@shared/schema";
import { Camera, Cog, Settings } from "lucide-react";

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("articles");
  const [isUploading, setIsUploading] = useState(false);

  // Get profile user data
  const { data: profileUser, isLoading: isProfileLoading } = useQuery<UserWithStats>({
    queryKey: [`/api/users/${params.id}`],
    enabled: !!params.id,
  });

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch('/api/users/upload-photo', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload photo');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries([`/api/users/${params.id}`]);
      toast({
        title: "Success",
        description: "Profile photo updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Error",
        description: "Photo size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    uploadPhotoMutation.mutate(file);
    setIsUploading(false);
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
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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

  const isOwnProfile = user && user.id === parseInt(params.id);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-12">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profileUser.avatarUrl || undefined} alt={profileUser.username} />
                  <AvatarFallback className="text-3xl">{getInitials(profileUser)}</AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 relative"
                      disabled={isUploading}
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      <Camera className="h-4 w-4" />
                      {isUploading ? "Uploading..." : "Upload Photo"}
                    </Button>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={isUploading}
                    />
                  </div>
                )}
              </div>

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

                <div className="flex gap-6 justify-center md:justify-start mb-4 bg-white p-4 rounded-lg shadow-sm">
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
                  {isOwnProfile ? (
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
                    >
                      {profileUser.isFollowing ? "Following" : "Follow"}
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
                <div className="text-center py-10 bg-neutral-50 rounded-md">
                  <p className="text-neutral-600">Articles will appear here.</p>
                </div>
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