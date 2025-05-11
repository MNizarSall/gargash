"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "./ui/textarea";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { models } from "@/lib/models";

const formSchema = z.object({
  prompt: z.string().min(2, {
    message: "Message must be at least 2 characters.",
  }),
  availableExperts: z.array(z.string()).min(1, {
    message: "Please select at least one agent type",
  }),
});

// Agent type colors and icons
const agentStyles = {
  sales: {
    baseColor: "text-green-600 border-green-200",
    selectedBg: "bg-green-500 hover:bg-green-600",
    unselectedBg: "bg-green-100 hover:bg-green-200 text-green-800",
    icon: "💼",
  },
  legal: {
    baseColor: "text-purple-600 border-purple-200",
    selectedBg: "bg-purple-500 hover:bg-purple-600",
    unselectedBg: "bg-purple-100 hover:bg-purple-200 text-purple-800",
    icon: "⚖️",
  },
  hr: {
    baseColor: "text-blue-600 border-blue-200",
    selectedBg: "bg-blue-500 hover:bg-blue-600",
    unselectedBg: "bg-blue-100 hover:bg-blue-200 text-blue-800",
    icon: "👥",
  },
  hr_ops_admin: {
    baseColor: "text-indigo-600 border-indigo-200",
    selectedBg: "bg-indigo-500 hover:bg-indigo-600",
    unselectedBg: "bg-indigo-100 hover:bg-indigo-200 text-indigo-800",
    icon: "🗂️",
  },
  payroll_benefits: {
    baseColor: "text-yellow-600 border-yellow-200",
    selectedBg: "bg-yellow-500 hover:bg-yellow-600",
    unselectedBg: "bg-yellow-100 hover:bg-yellow-200 text-yellow-800",
    icon: "💰",
  },
  recruitment: {
    baseColor: "text-pink-600 border-pink-200",
    selectedBg: "bg-pink-500 hover:bg-pink-600",
    unselectedBg: "bg-pink-100 hover:bg-pink-200 text-pink-800",
    icon: "🔍",
  },
};

export default function ChatForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      availableExperts: ["sales", "legal", "hr"],
    },
  });

  const { setValue, watch } = form;
  const availableExperts = watch("availableExperts");

  const toggleAgent = useCallback(
    (agentKey: string) => {
      const isSelected = availableExperts.includes(agentKey);

      if (isSelected) {
        // Don't remove if it's the last agent
        if (availableExperts.length > 1) {
          setValue(
            "availableExperts",
            availableExperts.filter((agent) => agent !== agentKey),
            { shouldValidate: true }
          );
        }
      } else {
        setValue("availableExperts", [...availableExperts, agentKey], {
          shouldValidate: true,
        });
      }
    },
    [availableExperts, setValue]
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.status === 201) {
        const { id } = await response.json();
        router.push(`/chats/${id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create chat");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("Failed to create chat. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative h-full flex items-center justify-center flex-col">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      <h2 className="text-2xl font-bold mb-8">Select Experts</h2>
      <div className="flex gap-4 flex-wrap mb-4 mx-auto max-w-3xl items-center justify-center">
        {Object.entries(models).map(([key, value]) => {
          if (key === "leader") return;
          const isSelected = availableExperts.includes(key);
          const style = agentStyles[key as keyof typeof agentStyles] || {
            baseColor: "text-gray-600 border-gray-200",
            selectedBg: "bg-gray-500 hover:bg-gray-600",
            unselectedBg: "bg-gray-100 hover:bg-gray-200 text-gray-800",
            icon: "🤖",
          };

          return (
            <Button
              key={key}
              type="button"
              variant="outline"
              className={cn(
                "cursor-pointer transition-all duration-200 ease-in-out border",
                isSelected
                  ? `${style.selectedBg} text-white scale-105 shadow-md`
                  : `${style.unselectedBg} scale-100`
              )}
              onClick={() => toggleAgent(key)}
            >
              <span className="mr-1.5">{style.icon}</span>
              {value}
              <span
                className={cn(
                  "ml-1.5 transition-transform duration-200",
                  isSelected ? "opacity-100" : "opacity-0 scale-0"
                )}
              >
                <Check className="h-4 w-4" />
              </span>
            </Button>
          );
        })}
      </div>

      <div className="mx-auto h-24 w-full rounded-xl bg-muted/50 absolute bottom-0">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 p-4"
          >
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder="Ask anything" {...field}></Textarea>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden field for agents */}
            <FormField
              control={form.control}
              name="availableExperts"
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <input
                      type="hidden"
                      {...fieldProps}
                      value={value.join(",")}
                      onChange={(e) => {
                        // This won't be triggered directly by the user
                        // but is required by React Hook Form
                        const newValue = e.target.value.split(",");
                        onChange(newValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {availableExperts.length} agent
                {availableExperts.length !== 1 ? "s" : ""} selected
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
