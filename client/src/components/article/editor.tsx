import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertArticleSchema } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface EditorProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  defaultValues?: any;
}

const articleFormSchema = insertArticleSchema.extend({
  tags: z.array(z.string()).optional(),
  tagInput: z.string().optional(),
}).omit({ authorId: true });

type ArticleFormValues = z.infer<typeof articleFormSchema>;

export default function Editor({ onSubmit, isSubmitting, defaultValues }: EditorProps) {
  const [tags, setTags] = useState<string[]>(defaultValues?.tags?.map((t: any) => t.name) || []);
  const [tagInput, setTagInput] = useState("");
  
  const { data: popularTags } = useQuery({
    queryKey: ["/api/tags/popular"],
    queryFn: async () => {
      const res = await fetch("/api/tags/popular");
      if (!res.ok) throw new Error("Failed to fetch popular tags");
      return res.json();
    },
  });
  
  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      content: defaultValues?.content || "",
      excerpt: defaultValues?.excerpt || "",
      readTime: defaultValues?.readTime || 5,
      coverImage: defaultValues?.coverImage || "",
      tags: tags,
      tagInput: "",
    },
  });
  
  useEffect(() => {
    if (defaultValues && defaultValues.tags) {
      const tagNames = defaultValues.tags.map((tag: any) => tag.name);
      setTags(tagNames);
      form.setValue("tags", tagNames);
    }
  }, [defaultValues, form]);
  
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      form.setValue("tags", newTags);
      setTagInput("");
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setValue("tags", newTags);
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  const handlePopularTagClick = (tagName: string) => {
    if (!tags.includes(tagName)) {
      const newTags = [...tags, tagName];
      setTags(newTags);
      form.setValue("tags", newTags);
    }
  };
  
  const handleFormSubmit = (data: ArticleFormValues) => {
    const { tagInput, ...formData } = data;
    onSubmit({
      ...formData,
      tags,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter article title" 
                  {...field} 
                  className="text-xl font-bold h-14"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excerpt</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="A brief summary of your article (optional)" 
                  {...field} 
                  className="min-h-20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Write your article here" 
                  {...field} 
                  className="min-h-80"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="readTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Read Time (minutes)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Estimated read time" 
                    type="number" 
                    min="1"
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Image URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="URL to cover image (optional)" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div>
          <FormLabel>Tags</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button 
                  type="button" 
                  onClick={() => handleRemoveTag(tag)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex">
            <Input 
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Add a tag"
              className="flex-grow"
            />
            <Button 
              type="button"
              variant="outline"
              onClick={handleAddTag}
              className="ml-2"
            >
              Add
            </Button>
          </div>
          
          {popularTags && popularTags.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-neutral-500 mb-1">Popular tags:</p>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag: any) => (
                  <Badge 
                    key={tag.id} 
                    variant="outline"
                    className="cursor-pointer hover:bg-neutral-100"
                    onClick={() => handlePopularTagClick(tag.name)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline">
            Save as Draft
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
