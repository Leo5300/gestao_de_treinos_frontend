"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useQueryStates, parseAsBoolean, parseAsString } from "nuqs";
import { Sparkles, X, ArrowUp } from "lucide-react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  message: z.string().min(1),
});

type FormSchema = z.infer<typeof formSchema>;

interface ChatProps {
  embedded?: boolean;
  initialMessage?: string;
}

export function Chat({ embedded = false, initialMessage }: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [queryState, setQueryState] = useQueryStates({
    open: parseAsBoolean.withDefault(false),
    message: parseAsString,
  });

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_API_URL}/ai`,
      credentials: "include",
    }),
  });

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    if (embedded && initialMessage && messages.length === 0) {
      sendMessage({
        text: initialMessage,
      });
    }
  }, [embedded, initialMessage, messages.length, sendMessage]);

  function onSubmit(values: FormSchema) {
    sendMessage({
      text: values.message,
    });

    form.reset();
  }

  if (!embedded && !queryState.open) {
    return (
      <button
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-white shadow-lg hover:bg-blue-700"
        onClick={() => setQueryState({ open: true })}
      >
        <Sparkles size={18} />
        Coach AI
      </button>
    );
  }

  return (
    <div className="flex h-full w-full flex-col rounded-xl border bg-white shadow-lg">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-600" size={18} />
          <span className="font-semibold">Coach AI</span>
        </div>

        {!embedded && (
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setQueryState({ open: false })}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "ml-auto bg-blue-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              {message.role === "assistant" ? (
                message.parts.map((part, index) =>
                  part.type === "text" ? (
                    <Streamdown key={index}>{part.text}</Streamdown>
                  ) : null
                )
              ) : (
                <p>
                  {message.parts
                    .filter((part) => part.type === "text")
                    .map((part) => part.text)
                    .join("")}
                </p>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex items-center gap-2 border-t p-3"
      >
        <input
          {...form.register("message")}
          placeholder="Digite sua mensagem"
          className="flex-1 rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={status === "streaming"}
          className="flex items-center justify-center rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <ArrowUp size={18} />
        </button>
      </form>
    </div>
  );
}