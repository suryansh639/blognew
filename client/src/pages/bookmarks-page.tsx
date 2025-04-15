
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ArticleListItem from "@/components/article/article-list-item";
import { Bookmark } from "lucide-react";
import { ArticleWithAuthor } from "@shared/schema";

export default function BookmarksPage() {
  const { user } = useAuth();

  const { data: bookmarks, isLoading } = useQuery<ArticleWithAuthor[]>({
    queryKey: [`/api/bookmarks`],
    enabled: !!user,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Bookmark className="h-6 w-6 text-primary-500" />
              <h1 className="text-3xl font-bold text-neutral-900">Your Bookmarks</h1>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading bookmarks...</div>
            ) : !bookmarks || bookmarks.length === 0 ? (
              <div className="text-center py-8 text-neutral-600">
                You haven't bookmarked any articles yet.
              </div>
            ) : (
              <div className="space-y-6">
                {bookmarks.map((article) => (
                  <ArticleListItem 
                    key={article.id} 
                    article={{
                      ...article,
                      isBookmarked: true // Since these are bookmarked articles
                    }} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
