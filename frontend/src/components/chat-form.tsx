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
import { redirect } from "next/navigation";

const formSchema = z.object({
  prompt: z.string().min(2, {
    message: "Message must be at least 2 characters.",
  }),
});

export default function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    console.log(response.status);
    if (response.status === 201) {
      const { id } = await response.json();
      redirect(`/chats/${id}`);
    }

    // .then((response) => response.json())
    // .then((data) => {
    //   // redirect to /chats/[id]
    //   if (!data.success) {
    //     throw new Error(data.message || "Failed to send message");
    //   }
    //   form.reset();
    // })
    // .catch((error) => {
    //   console.error("Error sending message:", error);
    // });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
        <Button type="submit">Send</Button>
      </form>
    </Form>
  );
}
