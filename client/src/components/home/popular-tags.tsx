import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Tag } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function PopularTags() {
  const { data: tags, isLoading, error } = useQuery<Tag[]>({
    queryKey: ["/api/tags/popular"],
  });

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-neutral-200 mb-8">
        <h3 className="text-lg font-serif font-bold mb-4 text-neutral-900">Popular Tags</h3>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border border-neutral-200 mb-8">
        <h3 className="text-lg font-serif font-bold mb-4 text-neutral-900">Popular Tags</h3>
        <div className="text-center text-red-500 py-4">
          Error loading tags. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-neutral-200 mb-8">
      <h3 className="text-lg font-serif font-bold mb-4 text-neutral-900">Popular Tags</h3>
      <div className="flex flex-wrap gap-2">
        {tags && tags.map((tag) => (
          <Link key={tag.id} href={`/?tag=${tag.name}`}>
            <a className="px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-sm hover:bg-neutral-200 transition-colors">
              {tag.name}
            </a>
          </Link>
        ))}
        
        {tags && tags.length === 0 && (
          <div className="text-center py-4 text-neutral-500 w-full">
            No tags found
          </div>
        )}
      </div>
    </div>
  );
}
