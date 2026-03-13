"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AlertCircle, ArrowUp, LoaderCircle, Sparkles, Wand2, X } from "lucide-react";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  message: z.string().trim().min(1),
});

const defaultSuggestions = [
  "Monte um treino para costas e biceps.",
  "Explique como fazer agachamento com seguranca.",
];

type FormSchema = z.infer<typeof formSchema>;

interface CoachAiChatProps {
  embedded?: boolean;
  initialMessage?: string;
}

export function CoachAiChat({
  embedded = false,
  initialMessage,
}: CoachAiChatProps) {
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const initialMessageSentRef = useRef(false);
  const initialQueryMessageSentRef = useRef<string | null>(null);

  const [queryState, setQueryState] = useQueryStates({
    chat_open: parseAsBoolean.withDefault(false),
    chat_initial_message: parseAsString,
  });

  const { messages, sendMessage, status, error } = useChat({
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

  const inputValue = useWatch({
    control: form.control,
    name: "message",
    defaultValue: "",
  });
  const isBusy = status === "submitted" || status === "streaming";
  const hideGlobalChat = !embedded && (pathname === "/auth" || pathname === "/onboarding");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: messages.length > 1 ? "smooth" : "auto",
    });
  }, [messages]);

  useEffect(() => {
    if (
      embedded &&
      initialMessage &&
      messages.length === 0 &&
      !initialMessageSentRef.current
    ) {
      initialMessageSentRef.current = true;
      sendMessage({ text: initialMessage });
    }
  }, [embedded, initialMessage, messages.length, sendMessage]);

  useEffect(() => {
    if (!queryState.chat_open) {
      initialQueryMessageSentRef.current = null;
      return;
    }

    if (embedded || !queryState.chat_initial_message) {
      return;
    }

    if (initialQueryMessageSentRef.current === queryState.chat_initial_message) {
      return;
    }

    initialQueryMessageSentRef.current = queryState.chat_initial_message;
    sendMessage({ text: queryState.chat_initial_message });
    setQueryState({ chat_initial_message: null });
  }, [
    embedded,
    queryState.chat_initial_message,
    queryState.chat_open,
    sendMessage,
    setQueryState,
  ]);

  function handleClose() {
    setQueryState({
      chat_open: false,
      chat_initial_message: null,
    });
  }

  function submitMessage(message: string) {
    sendMessage({ text: message });
    form.reset();
  }

  function onSubmit(values: FormSchema) {
    submitMessage(values.message);
  }

  if (hideGlobalChat) {
    return null;
  }

  if (!embedded && !queryState.chat_open) {
    return null;
  }

  const panelContent = (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-border/80 bg-background/95 shadow-[0_26px_80px_-28px_rgba(14,15,26,0.45)] backdrop-blur-xl",
        embedded && "rounded-[32px]",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(77,92,255,0.18),transparent_70%)]" />

      <div className="relative flex items-start justify-between border-b border-border/70 px-5 pb-4 pt-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
            <Sparkles className="size-5" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-heading text-base font-semibold text-foreground">
                Coach AI
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                online
              </span>
            </div>

            <p className="max-w-[26rem] font-heading text-xs leading-5 text-muted-foreground">
              Tire duvidas de treino, ajuste exercicios e receba respostas rapidas dentro do app.
            </p>
          </div>
        </div>

        {!embedded && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-muted-foreground"
            onClick={handleClose}
            aria-label="Fechar chat"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {error && (
        <div className="border-b border-destructive/15 bg-destructive/5 px-5 py-3">
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div className="font-heading text-xs leading-5">
              {error instanceof Error
                ? error.message
                : "Nao foi possivel falar com a IA agora."}
            </div>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(77,92,255,0.04)_0%,rgba(255,255,255,0)_22%,rgba(255,255,255,0)_100%)] px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-between gap-6">
            <div className="rounded-[24px] border border-primary/10 bg-primary/5 p-5">
              <div className="mb-4 flex items-center gap-2 text-primary">
                <Wand2 className="size-4" />
                <span className="font-heading text-xs font-semibold uppercase tracking-[0.18em]">
                  FIT.AI Assistant
                </span>
              </div>

              <h2 className="font-heading text-2xl font-semibold leading-[1.05] text-foreground">
                Abra uma conversa e refine seu treino em segundos.
              </h2>

              <p className="mt-3 font-heading text-sm leading-6 text-muted-foreground">
                Pergunte sobre exercicios, tecnica, divisoes de treino ou ajustes para o plano atual.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {defaultSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => submitMessage(suggestion)}
                  className="rounded-full border border-border bg-background px-4 py-2 font-heading text-xs font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/5"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-full flex-col gap-3">
            {messages.map((message) => {
              const textParts = message.parts.filter(
                (
                  part,
                ): part is {
                  type: "text";
                  text: string;
                } => part.type === "text",
              );

              if (textParts.length === 0) {
                return null;
              }

              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={cn("flex", isUser ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[86%] rounded-[22px] px-4 py-3 shadow-sm md:max-w-[82%]",
                      isUser
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border border-border/70 bg-card text-card-foreground",
                    )}
                  >
                    {isUser ? (
                      <p className="font-heading text-sm leading-6">
                        {textParts.map((part) => part.text).join("")}
                      </p>
                    ) : (
                      <Streamdown className="font-heading text-sm leading-6 text-foreground [&_p]:my-0 [&_ul]:my-3">
                        {textParts.map((part) => part.text).join("")}
                      </Streamdown>
                    )}
                  </div>
                </div>
              );
            })}

            {isBusy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-2 text-muted-foreground shadow-sm">
                  <LoaderCircle className="size-4 animate-spin" />
                  <span className="font-heading text-xs">
                    Coach AI esta respondendo...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="border-t border-border/70 bg-background/90 p-4"
      >
        <div className="flex items-center gap-2">
          <Input
            {...form.register("message")}
            placeholder="Digite sua pergunta para o Coach AI"
            className="h-12 rounded-2xl border-border bg-secondary/60 px-4 font-heading text-sm shadow-none focus-visible:ring-primary/20"
          />

          <Button
            type="submit"
            size="icon-lg"
            disabled={isBusy || inputValue.trim().length === 0}
            className="size-12 rounded-2xl shadow-[0_16px_36px_-22px_rgba(77,92,255,0.8)]"
            aria-label="Enviar mensagem"
          >
            <ArrowUp className="size-5" />
          </Button>
        </div>
      </form>
    </div>
  );

  if (embedded) {
    return <div className="flex min-h-0 flex-1">{panelContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-[70] md:pointer-events-none">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px] md:hidden"
        onClick={handleClose}
        aria-label="Fechar chat"
      />

      <div className="absolute inset-x-4 bottom-[5.5rem] top-4 md:pointer-events-auto md:inset-auto md:bottom-24 md:right-5 md:top-auto md:h-[680px] md:w-[420px]">
        {panelContent}
      </div>
    </div>
  );
}
