"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import {
  AlertCircle,
  ArrowUp,
  CheckCircle2,
  LoaderCircle,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { GetWorkoutPlan200 } from "@/app/_lib/api/fetch-generated";
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

const weekdayLabels: Record<string, string> = {
  MONDAY: "Seg",
  TUESDAY: "Ter",
  WEDNESDAY: "Qua",
  THURSDAY: "Qui",
  FRIDAY: "Sex",
  SATURDAY: "Sab",
  SUNDAY: "Dom",
};

type FormSchema = z.infer<typeof formSchema>;

interface ChatProps {
  embedded?: boolean;
  initialMessage?: string;
  onboarding?: boolean;
}

export function Chat({
  embedded = false,
  initialMessage,
  onboarding = false,
}: ChatProps) {
  const pathname = usePathname();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const initialMessageSentRef = useRef(false);
  const initialQueryMessageSentRef = useRef<string | null>(null);
  const lastPlanCheckAssistantMessageId = useRef<string | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);

  const [queryState, setQueryState] = useQueryStates({
    chat_open: parseAsBoolean.withDefault(false),
    chat_initial_message: parseAsString,
  });

  const [checkingPlan, setCheckingPlan] = useState(false);
  const [planCreated, setPlanCreated] = useState(false);
  const [createdPlan, setCreatedPlan] = useState<GetWorkoutPlan200 | null>(null);
  const [showCreatedPlanModal, setShowCreatedPlanModal] = useState(false);

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

  const inputValue = form.watch("message");
  const isBusy = status === "submitted" || status === "streaming";
  const hideGlobalChat =
    !embedded && (pathname === "/auth" || pathname === "/onboarding");
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const createdTrainingDays =
    createdPlan?.workoutDays.filter((day) => !day.isRest) ?? [];
  const createdRestDaysCount =
    (createdPlan?.workoutDays.length ?? 0) - createdTrainingDays.length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: messages.length > 1 ? "smooth" : "auto",
    });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

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

  const checkIfPlanWasCreated = useEffectEvent(async () => {
    try {
      setCheckingPlan(true);

      const today = dayjs().format("YYYY-MM-DD");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/home/${today}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      if (response.status === 401) {
        router.replace("/auth");
        router.refresh();
        return;
      }

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data?.activeWorkoutPlanId) {
        const planResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/workout-plans/${data.activeWorkoutPlanId}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        if (planResponse.status === 401) {
          router.replace("/auth");
          router.refresh();
          return;
        }

        if (planResponse.ok) {
          const nextPlan = (await planResponse.json()) as GetWorkoutPlan200;
          setCreatedPlan(nextPlan);
        }

        setPlanCreated(true);
        setShowCreatedPlanModal(true);

        if (redirectTimeoutRef.current) {
          window.clearTimeout(redirectTimeoutRef.current);
        }

        redirectTimeoutRef.current = window.setTimeout(() => {
          router.replace("/");
          router.refresh();
        }, 3600);
      }
    } catch (planCheckError) {
      console.error("Erro ao verificar criacao do plano:", planCheckError);
    } finally {
      setCheckingPlan(false);
    }
  });

  useEffect(() => {
    if (!onboarding || status !== "ready" || planCreated || checkingPlan) {
      return;
    }

    if (!lastAssistantMessage) {
      return;
    }

    if (
      lastPlanCheckAssistantMessageId.current === lastAssistantMessage.id
    ) {
      return;
    }

    lastPlanCheckAssistantMessageId.current = lastAssistantMessage.id;
    void checkIfPlanWasCreated();
  }, [checkingPlan, lastAssistantMessage, onboarding, planCreated, status]);

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
              {onboarding
                ? "Vou coletar seus dados, entender seu objetivo e montar seu treino sem te tirar do fluxo."
                : "Tire duvidas de treino, ajuste exercicios e receba respostas rapidas dentro do app."}
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
                {onboarding
                  ? "Vamos montar seu treino de forma guiada."
                  : "Abra uma conversa e refine seu treino em segundos."}
              </h2>

              <p className="mt-3 font-heading text-sm leading-6 text-muted-foreground">
                {onboarding
                  ? "Eu vou te perguntar apenas o necessario e criar seu plano assim que houver informacao suficiente."
                  : "Pergunte sobre exercicios, tecnica, divisoes de treino ou ajustes para o plano atual."}
              </p>
            </div>

            {!onboarding && (
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
            )}
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
                    {onboarding && checkingPlan
                      ? "Finalizando seu plano..."
                      : "Coach AI esta respondendo..."}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {!planCreated && (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="border-t border-border/70 bg-background/90 p-4"
        >
          <div className="flex items-center gap-2">
            <Input
              {...form.register("message")}
              placeholder={
                onboarding
                  ? "Responda aqui para continuar seu onboarding"
                  : "Digite sua pergunta para o Coach AI"
              }
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
      )}
    </div>
  );

  const createdPlanModal =
    showCreatedPlanModal && planCreated ? (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-[3px]">
        <div className="w-full max-w-lg overflow-hidden rounded-[30px] border border-border/70 bg-background shadow-[0_28px_80px_-30px_rgba(14,15,26,0.55)]">
          <div className="bg-[radial-gradient(circle_at_top,rgba(77,92,255,0.18),transparent_65%)] px-6 pb-5 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600">
                  <CheckCircle2 className="size-6" />
                </div>

                <div>
                  <p className="font-heading text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Plano montado
                  </p>
                  <h3 className="mt-2 font-heading text-2xl font-semibold leading-[1.02] text-foreground">
                    {createdPlan?.name ?? "Seu treino esta pronto."}
                  </h3>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-muted-foreground"
                onClick={() => setShowCreatedPlanModal(false)}
                aria-label="Fechar modal do treino"
              >
                <X className="size-4" />
              </Button>
            </div>

            <p className="mt-4 font-heading text-sm leading-6 text-muted-foreground">
              A IA concluiu seu onboarding e eu ja vou te levar para a home com
              o plano salvo.
            </p>
          </div>

          <div className="grid gap-3 px-6 py-5 md:grid-cols-3">
            <div className="rounded-[22px] border border-border bg-card px-4 py-4">
              <p className="font-heading text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Dias de treino
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {createdTrainingDays.length}
              </p>
            </div>

            <div className="rounded-[22px] border border-border bg-card px-4 py-4">
              <p className="font-heading text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Dias de descanso
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {createdRestDaysCount}
              </p>
            </div>

            <div className="rounded-[22px] border border-border bg-card px-4 py-4">
              <p className="font-heading text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Status
              </p>
              <p className="mt-2 font-heading text-lg font-semibold text-primary">
                Pronto para treinar
              </p>
            </div>
          </div>

          {createdTrainingDays.length > 0 && (
            <div className="border-t border-border px-6 py-5">
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Semana inicial
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {createdTrainingDays.slice(0, 7).map((day) => (
                  <div
                    key={day.id}
                    className="rounded-full border border-primary/12 bg-primary/8 px-3 py-2 font-heading text-xs font-semibold text-foreground"
                  >
                    {weekdayLabels[day.weekDay] ?? day.weekDay} · {day.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-5">
            <p className="font-heading text-xs leading-5 text-muted-foreground">
              Redirecionando automaticamente para a home.
            </p>

            <Button
              type="button"
              className="rounded-full px-5"
              onClick={() => {
                router.replace("/");
                router.refresh();
              }}
            >
              Ir para minha home
            </Button>
          </div>
        </div>
      </div>
    ) : null;

  if (embedded) {
    return (
      <>
        <div className="flex min-h-0 flex-1">{panelContent}</div>
        {createdPlanModal}
      </>
    );
  }

  return (
    <>
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

      {createdPlanModal}
    </>
  );
}
