import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import FeaturedArticles from "@/components/home/featured-articles";
import PopularAuthors from "@/components/home/popular-authors";
import PopularTags from "@/components/home/popular-tags";
import NewsletterSignup from "@/components/home/newsletter-signup";
import ArticleListItem from "@/components/article/article-list-item";
import TagFilter from "@/components/common/tag-filter";
import Pagination from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleWithAuthor } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tagParam = params.get("tag");
    const pageParam = params.get("page");

    if (tagParam) {
      setSelectedTag(tagParam);
    }

    if (pageParam) {
      setCurrentPage(parseInt(pageParam) || 1);
    }
  }, [location]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedTag) {
      params.set("tag", selectedTag);
    }

    if (currentPage > 1) {
      params.set("page", currentPage.toString());
    }

    const newUrl = params.toString() ? `/?${params.toString()}` : "/";

    if (location !== newUrl) {
      setLocation(newUrl, { replace: true });
    }
  }, [selectedTag, currentPage, setLocation]);

  const { data: articles, isLoading, error } = useQuery<ArticleWithAuthor[]>({
    queryKey: ["/api/articles", { limit, offset: (currentPage - 1) * limit, tag: selectedTag }],
    queryFn: async () => {
      const offset = (currentPage - 1) * limit;
      let url = `/api/articles?limit=${limit}&offset=${offset}`;

      if (selectedTag) {
        url += `&tag=${encodeURIComponent(selectedTag)}`;
      }

      const res = await fetch(url);

      // Get total count from headers or estimate from data
      const totalCountHeader = res.headers.get("X-Total-Count");
      if (totalCountHeader) {
        const totalCount = parseInt(totalCountHeader);
        setTotalPages(Math.ceil(totalCount / limit));
      }

      if (!res.ok) throw new Error("Failed to fetch articles");
      return res.json();
    },
  });

  // If we don't have a total count header, estimate from data
  useEffect(() => {
    if (articles && articles.length < limit && currentPage === 1) {
      setTotalPages(1);
    } else if (articles && articles.length === limit) {
      // There might be more pages
      setTotalPages(currentPage + 1);
    }
  }, [articles, currentPage, limit]);

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    setCurrentPage(1); // Reset to page 1 when changing tag
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-red-50 to-white border-b border-neutral-200 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-neutral-100/25 bg-[size:20px_20px] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 mb-6">Discover stories that matter</h1>
            <p className="text-xl text-neutral-600 mb-10">Read and share new perspectives on just about any topic. Everyone's welcome.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                className="px-8 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors text-lg shadow-lg hover:shadow-xl"
                onClick={() => setLocation("/auth")}
              >
                Get started
              </Button>
              <Button
                variant="outline"
                className="px-8 py-3 text-neutral-700 rounded-full font-medium border-2 border-neutral-300 hover:bg-neutral-100 transition-colors text-lg"
              >
                Learn more
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <FeaturedArticles />

      {/* Main Content */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row">
            {/* Articles Feed */}
            <div className="lg:w-2/3 lg:pr-12">
              {/* Tags Filter */}
              <TagFilter selectedTag={selectedTag} onSelectTag={handleTagSelect} />

              {/* Articles List */}
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="pb-10 mb-10 border-b border-neutral-200">
                    <div className="flex items-center mb-4">
                      <Skeleton className="h-10 w-10 rounded-full mr-3" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row">
                      <div className="md:flex-1 md:pr-8">
                        <Skeleton className="h-8 w-full mb-2" />
                        <Skeleton className="h-8 w-2/3 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-4" />
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
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
                ))
              ) : error ? (
                <div className="text-center py-10 bg-red-50 rounded-md">
                  <p className="text-red-500">Error loading articles. Please try again later.</p>
                </div>
              ) : articles && articles.length > 0 ? (
                articles.map(article => (
                  <ArticleListItem key={article.id} article={article} />
                ))
              ) : (
                <div className="text-center py-10 bg-neutral-50 rounded-md">
                  <p className="text-neutral-600">No articles found. {selectedTag && `Try a different tag or `}
                    <Button 
                      variant="link" 
                      className="text-primary-500 p-0"
                      onClick={() => setSelectedTag(null)}
                    >
                      view all articles
                    </Button>.
                  </p>
                </div>
              )}

              {/* Pagination */}
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
              />
            </div>

            {/* Sidebar */}
            <div className="lg:w-1/3 mt-12 lg:mt-0">
              <PopularAuthors />
              <PopularTags />
              <NewsletterSignup />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}