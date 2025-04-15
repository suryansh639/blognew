import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import ArticleCard from "@/components/article/article-card";
import { ArticleWithAuthor } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeaturedArticles() {
  const { data: articles, isLoading, error } = useQuery<ArticleWithAuthor[]>({
    queryKey: ["/api/articles/featured"],
  });

  if (isLoading) {
    return (
      <section className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-serif font-bold text-neutral-900">Featured Articles</h2>
            <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden border border-neutral-200">
                <Skeleton className="h-48 w-full" />
                <div className="p-6 space-y-3">
                  <div className="flex items-center mb-4">
                    <Skeleton className="h-8 w-8 rounded-full mr-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-500">
            Error loading featured articles. Please try again later.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-serif font-bold text-neutral-900">Featured Articles</h2>
          <Link href="/">
            <a className="text-primary-500 hover:text-primary-600 font-medium">View all</a>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles && articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
          
          {articles && articles.length === 0 && (
            <div className="col-span-full text-center py-8 text-neutral-500">
              No featured articles yet. Check back soon!
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
