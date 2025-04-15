import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tag } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TagFilterProps {
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export default function TagFilter({ selectedTag, onSelectTag }: TagFilterProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data: tags, isLoading, error } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const checkScrollPosition = () => {
    const container = containerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener("resize", checkScrollPosition);
    return () => window.removeEventListener("resize", checkScrollPosition);
  }, [tags]);

  const handleScroll = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = 200;
      const newPosition =
        direction === "left"
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: newPosition,
        behavior: "smooth",
      });
      
      setScrollPosition(newPosition);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-8 relative">
        <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-hide">
          <Skeleton className="h-10 w-16 rounded-full" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 text-red-500 text-center py-2 bg-red-50 rounded-md">
        Error loading tags. Please try again later.
      </div>
    );
  }

  return (
    <div className="mb-8 relative">
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md rounded-full"
          onClick={() => handleScroll("left")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      
      <div
        ref={containerRef}
        className="flex overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide px-6 gap-2"
        onScroll={checkScrollPosition}
      >
        <Button
          variant={selectedTag === null ? "default" : "outline"}
          className="rounded-full"
          onClick={() => onSelectTag(null)}
        >
          All
        </Button>
        
        {tags && tags.map((tag) => (
          <Button
            key={tag.id}
            variant={selectedTag === tag.name ? "default" : "outline"}
            className="rounded-full"
            onClick={() => onSelectTag(tag.name)}
          >
            {tag.name}
          </Button>
        ))}
      </div>
      
      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md rounded-full"
          onClick={() => handleScroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
