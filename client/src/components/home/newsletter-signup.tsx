import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewsletterSignup() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // In a real app, this would send the data to an API
      // await fetch('/api/newsletter', { method: 'POST', body: JSON.stringify(data) });
      
      toast({
        title: "Subscription successful!",
        description: "Thank you for subscribing to our newsletter.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: "There was an error subscribing to the newsletter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-primary-50 p-6 rounded-lg border border-primary-200 mb-8">
      <h3 className="text-lg font-serif font-bold mb-2 text-neutral-900">Subscribe to our newsletter</h3>
      <p className="text-neutral-600 text-sm mb-4">
        Get the latest articles, resources and updates right in your inbox.
      </p>
      <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <Input
            type="email"
            placeholder="Enter your email"
            {...form.register("email")}
            className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {form.formState.errors.email && (
            <p className="mt-1 text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Subscribing..." : "Subscribe"}
        </Button>
      </form>
    </div>
  );
}
