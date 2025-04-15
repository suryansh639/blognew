
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertArticleSchema } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Bold, Italic, Image as ImageIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

const articleFormSchema = insertArticleSchema.extend({
  tags: z.array(z.string()).optional(),
  tagInput: z.string().optional(),
}).omit({ authorId: true });

type ArticleFormValues = z.infer<typeof articleFormSchema>;

interface EditorProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  defaultValues?: any;
}

export default function Editor({ onSubmit, isSubmitting, defaultValues }: EditorProps) {
  const [tags, setTags] = useState<string[]>(defaultValues?.tags?.map((t: any) => t.name) || []);
  const [tagInput, setTagInput] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image
    ],
    content: defaultValues?.content || "",
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[300px]'
      }
    }
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

  const handleAddImage = () => {
    const url = prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleFormSubmit = (data: ArticleFormValues) => {
    const { tagInput, ...formData } = data;
    onSubmit({
      ...formData,
      tags,
      content: editor?.getHTML() || ""
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

        <div>
          <FormLabel>Content</FormLabel>
          <div className="border rounded-lg overflow-hidden">
            <div className="border-b p-2 bg-neutral-50 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={editor?.isActive('bold') ? 'bg-neutral-200' : ''}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={editor?.isActive('italic') ? 'bg-neutral-200' : ''}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddImage}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

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
                  onClick={() => setTags(tags.filter(t => t !== tag))}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                    setTags([...tags, tagInput.trim()]);
                    setTagInput("");
                  }
                }
              }}
              placeholder="Add a tag"
              className="flex-grow"
            />
            <Button 
              type="button"
              variant="outline"
              onClick={() => {
                if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                  setTags([...tags, tagInput.trim()]);
                  setTagInput("");
                }
              }}
              className="ml-2"
            >
              Add
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
