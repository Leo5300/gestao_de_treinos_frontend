"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUp,
  CheckCircle2,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";
import type { GetUserTrainData200 } from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type GuidedMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type ExperienceLevel = "beginner" | "intermediate" | "advanced";

type EquipmentAccess = "bodyweight" | "basic" | "gym";

type GeneratedWorkoutPlan = {
  id: string;
  name: string;
  summary: string;
  workoutDays: Array<{
    name: string;
    weekDay: string;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    coverImageUrl?: string;
    exercises: Array<{
      order: number;
      name: string;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }>;
  }>;
};

type GuidedAnswers = {
  weightInKg?: number;
  heightInCentimeters?: number;
  age?: number;
  bodyFatPercentage?: number | null;
  objective?: string;
  experienceLevel?: ExperienceLevel;
  workoutDaysPerWeek?: number;
  sessionDurationInMinutes?: number;
  equipmentAccess?: EquipmentAccess;
  restrictions?: string;
};

type QuestionKey = keyof GuidedAnswers;

type Question = {
  key: QuestionKey;
  prompt: string;
  helper?: string;
  parse: (value: string) =>
    | { ok: true; value: GuidedAnswers[QuestionKey] }
    | { ok: false; message: string };
};

interface GuidedOnboardingChatProps {
  embedded?: boolean;
  initialTrainData: GetUserTrainData200;
  initialMessage?: string;
}

const weekdayLabels: Record<string, string> = {
  MONDAY: "Seg",
  TUESDAY: "Ter",
  WEDNESDAY: "Qua",
  THURSDAY: "Qui",
  FRIDAY: "Sex",
  SATURDAY: "Sab",
  SUNDAY: "Dom",
};

const messageId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const parseNumber = (
  rawValue: string,
  options: {
    min: number;
    max: number;
    integer?: boolean;
    invalidMessage: string;
  },
) => {
  const normalizedValue = rawValue.replace(",", ".").trim();
  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue)) {
    return { ok: false as const, message: options.invalidMessage };
  }

  if (options.integer && !Number.isInteger(parsedValue)) {
    return { ok: false as const, message: options.invalidMessage };
  }

  if (parsedValue < options.min || parsedValue > options.max) {
    return { ok: false as const, message: options.invalidMessage };
  }

  return { ok: true as const, value: parsedValue };
};

const buildQuestions = (trainData: GetUserTrainData200): Question[] => {
  const questions: Question[] = [];

  if (!trainData?.weightInGrams || trainData.weightInGrams <= 0) {
    questions.push({
      key: "weightInKg",
      prompt: "Qual e o seu peso atual em kg?",
      helper: "Exemplo: 72.5",
      parse: (value) =>
        parseNumber(value, {
          min: 20,
          max: 400,
          invalidMessage: "Me passe um peso valido em kg. Exemplo: 72.5",
        }),
    });
  }

  if (!trainData?.heightInCentimeters || trainData.heightInCentimeters <= 0) {
    questions.push({
      key: "heightInCentimeters",
      prompt: "Qual e a sua altura em centimetros?",
      helper: "Exemplo: 175",
      parse: (value) =>
        parseNumber(value, {
          min: 100,
          max: 260,
          integer: true,
          invalidMessage: "Me passe uma altura valida em cm. Exemplo: 175",
        }),
    });
  }

  if (!trainData?.age || trainData.age <= 0) {
    questions.push({
      key: "age",
      prompt: "Qual e a sua idade?",
      parse: (value) =>
        parseNumber(value, {
          min: 12,
          max: 100,
          integer: true,
          invalidMessage: "Me passe uma idade valida em anos. Exemplo: 28",
        }),
    });
  }

  if (trainData?.bodyFatPercentage == null) {
    questions.push({
      key: "bodyFatPercentage",
      prompt:
        "Se souber, qual e o seu percentual de gordura? Se nao souber, digite pular.",
      helper: "Exemplo: 18 ou pular",
      parse: (value) => {
        const normalizedValue = value.trim().toLowerCase();

        if (["pular", "nao sei", "não sei", "skip"].includes(normalizedValue)) {
          return { ok: true as const, value: null };
        }

        return parseNumber(value, {
          min: 2,
          max: 70,
          invalidMessage: "Digite um percentual valido ou pular.",
        });
      },
    });
  }

  questions.push(
    {
      key: "objective",
      prompt: "Qual e o seu objetivo principal com esse treino?",
      helper: "Exemplo: hipertrofia, emagrecimento ou condicionamento",
      parse: (value) => {
        const normalizedValue = value.trim();

        if (normalizedValue.length < 3) {
          return {
            ok: false as const,
            message: "Descreva seu objetivo com um pouco mais de detalhe.",
          };
        }

        return { ok: true as const, value: normalizedValue };
      },
    },
    {
      key: "experienceLevel",
      prompt: "Qual e o seu nivel de treino hoje: iniciante, intermediario ou avancado?",
      parse: (value) => {
        const normalizedValue = value.trim().toLowerCase();

        if (["iniciante", "beginner", "1"].includes(normalizedValue)) {
          return { ok: true as const, value: "beginner" };
        }

        if (["intermediario", "intermediário", "intermediate", "2"].includes(normalizedValue)) {
          return { ok: true as const, value: "intermediate" };
        }

        if (["avancado", "avançado", "advanced", "3"].includes(normalizedValue)) {
          return { ok: true as const, value: "advanced" };
        }

        return {
          ok: false as const,
          message: "Responda com iniciante, intermediario ou avancado.",
        };
      },
    },
    {
      key: "workoutDaysPerWeek",
      prompt: "Quantos dias por semana voce quer treinar?",
      helper: "De 1 a 7",
      parse: (value) =>
        parseNumber(value, {
          min: 1,
          max: 7,
          integer: true,
          invalidMessage: "Me diga um numero de 1 a 7 dias por semana.",
        }),
    },
    {
      key: "sessionDurationInMinutes",
      prompt: "Quanto tempo voce tem por treino, em minutos?",
      helper: "Exemplo: 45",
      parse: (value) =>
        parseNumber(value, {
          min: 15,
          max: 180,
          integer: true,
          invalidMessage: "Me diga um tempo entre 15 e 180 minutos.",
        }),
    },
    {
      key: "equipmentAccess",
      prompt: "Voce treina com peso corporal, equipamentos basicos ou academia completa?",
      helper: "Responda com peso corporal, basico ou academia",
      parse: (value) => {
        const normalizedValue = value.trim().toLowerCase();

        if (["peso corporal", "bodyweight", "corpo livre"].includes(normalizedValue)) {
          return { ok: true as const, value: "bodyweight" };
        }

        if (["basico", "básico", "basic", "equipamentos basicos", "equipamentos básicos"].includes(normalizedValue)) {
          return { ok: true as const, value: "basic" };
        }

        if (["academia", "academia completa", "gym"].includes(normalizedValue)) {
          return { ok: true as const, value: "gym" };
        }

        return {
          ok: false as const,
          message: "Responda com peso corporal, basico ou academia.",
        };
      },
    },
    {
      key: "restrictions",
      prompt:
        "Tem alguma lesao, restricao ou observacao importante? Se nao tiver, digite nenhuma.",
      parse: (value) => {
        const normalizedValue = value.trim();

        if (!normalizedValue) {
          return { ok: true as const, value: "" };
        }

        if (["nenhuma", "nao", "não", "sem", "nenhum"].includes(normalizedValue.toLowerCase())) {
          return { ok: true as const, value: "" };
        }

        return { ok: true as const, value: normalizedValue };
      },
    },
  );

  return questions;
};

export function GuidedOnboardingChat({
  embedded = false,
  initialTrainData,
  initialMessage,
}: GuidedOnboardingChatProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<GuidedMessage[]>([]);
  const [answers, setAnswers] = useState<GuidedAnswers>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPlan, setCreatedPlan] = useState<GeneratedWorkoutPlan | null>(null);
  const [showCreatedPlanModal, setShowCreatedPlanModal] = useState(false);

  const questions = useMemo(() => buildQuestions(initialTrainData), [initialTrainData]);
  const currentQuestion = questions[currentQuestionIndex];
  const createdTrainingDays = createdPlan?.workoutDays.filter((day) => !day.isRest) ?? [];
  const createdRestDaysCount = (createdPlan?.workoutDays.length ?? 0) - createdTrainingDays.length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: messages.length > 1 ? "smooth" : "auto",
    });
  }, [messages]);

  useEffect(() => {
    const intro = initialMessage?.trim()
      ? `${initialMessage.trim()} Vou seguir um roteiro curto para coletar so o necessario e gerar seu plano no final.`
      : initialTrainData
        ? "Seus dados basicos ja estao parcialmente salvos. Vou completar o que falta e gerar seu plano no final."
        : "Vou seguir um roteiro curto para coletar so o necessario e gerar seu plano no final.";

    const firstQuestion = questions[0]?.prompt ?? "Tudo certo. Vou gerar seu treino agora.";
    const helper = questions[0]?.helper ? ` ${questions[0].helper}` : "";

    setMessages([
      {
        id: messageId(),
        role: "assistant",
        content: intro,
      },
      {
        id: messageId(),
        role: "assistant",
        content: `${firstQuestion}${helper}`,
      },
    ]);
  }, [initialMessage, initialTrainData, questions]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const pushAssistantMessage = (content: string) => {
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: messageId(), role: "assistant", content },
    ]);
  };

  const pushUserMessage = (content: string) => {
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: messageId(), role: "user", content },
    ]);
  };

  const formatErrorMessage = async (response: Response) => {
    try {
      const data = (await response.json()) as { error?: string; code?: string };

      if (data.code === "INCOMPLETE_USER_TRAIN_DATA") {
        return "Ainda faltam dados fisicos obrigatorios para gerar seu treino.";
      }

      if (data.code === "DUPLICATED_SESSION_COOKIE") {
        return "Sua sessao ficou duplicada. Entre novamente para continuar.";
      }

      return data.error || "Nao foi possivel concluir seu onboarding agora.";
    } catch {
      return "Nao foi possivel concluir seu onboarding agora.";
    }
  };

  const submitFinalOnboarding = async (nextAnswers: GuidedAnswers) => {
    const weightInKg = nextAnswers.weightInKg ?? (initialTrainData?.weightInGrams ? initialTrainData.weightInGrams / 1000 : undefined);
    const heightInCentimeters = nextAnswers.heightInCentimeters ?? initialTrainData?.heightInCentimeters ?? undefined;
    const age = nextAnswers.age ?? initialTrainData?.age ?? undefined;
    const bodyFatPercentage =
      nextAnswers.bodyFatPercentage !== undefined
        ? nextAnswers.bodyFatPercentage
        : initialTrainData?.bodyFatPercentage ?? null;

    if (!weightInKg || !heightInCentimeters || !age) {
      throw new Error("Ainda faltam dados fisicos obrigatorios para gerar seu treino.");
    }

    const trainDataResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        weightInGrams: Math.round(weightInKg * 1000),
        heightInCentimeters,
        age,
        bodyFatPercentage,
      }),
    });

    if (trainDataResponse.status === 401) {
      router.replace("/auth");
      router.refresh();
      return;
    }

    if (!trainDataResponse.ok) {
      throw new Error(await formatErrorMessage(trainDataResponse));
    }

    const planResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/ai/workout-plan`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          objective: nextAnswers.objective,
          experienceLevel: nextAnswers.experienceLevel,
          workoutDaysPerWeek: nextAnswers.workoutDaysPerWeek,
          sessionDurationInMinutes: nextAnswers.sessionDurationInMinutes,
          equipmentAccess: nextAnswers.equipmentAccess,
          restrictions: nextAnswers.restrictions || null,
        }),
      },
    );

    if (planResponse.status === 401) {
      router.replace("/auth");
      router.refresh();
      return;
    }

    if (!planResponse.ok) {
      throw new Error(await formatErrorMessage(planResponse));
    }

    const generatedPlan = (await planResponse.json()) as GeneratedWorkoutPlan;
    setCreatedPlan(generatedPlan);
    setShowCreatedPlanModal(true);
    pushAssistantMessage(`${generatedPlan.summary} Seu treino ja foi salvo e vou te levar para a home.`);

    if (redirectTimeoutRef.current) {
      window.clearTimeout(redirectTimeoutRef.current);
    }

    redirectTimeoutRef.current = window.setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 3600);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentQuestion || isSubmitting || inputValue.trim().length === 0) {
      return;
    }

    setError(null);

    const submittedValue = inputValue.trim();
    pushUserMessage(submittedValue);
    setInputValue("");

    const parsedAnswer = currentQuestion.parse(submittedValue);

    if (!parsedAnswer.ok) {
      pushAssistantMessage(parsedAnswer.message);
      pushAssistantMessage(
        `${currentQuestion.prompt}${currentQuestion.helper ? ` ${currentQuestion.helper}` : ""}`,
      );
      return;
    }

    const nextAnswers = {
      ...answers,
      [currentQuestion.key]: parsedAnswer.value,
    } satisfies GuidedAnswers;

    setAnswers(nextAnswers);

    const nextQuestion = questions[currentQuestionIndex + 1];

    if (nextQuestion) {
      setCurrentQuestionIndex((currentIndex) => currentIndex + 1);
      pushAssistantMessage(
        `${nextQuestion.prompt}${nextQuestion.helper ? ` ${nextQuestion.helper}` : ""}`,
      );
      return;
    }

    setIsSubmitting(true);
    pushAssistantMessage("Perfeito. Estou consolidando suas respostas e montando seu treino agora.");

    try {
      await submitFinalOnboarding(nextAnswers);
    } catch (submitError) {
      const nextError =
        submitError instanceof Error
          ? submitError.message
          : "Nao foi possivel concluir seu onboarding agora.";

      setError(nextError);
      pushAssistantMessage(nextError);
    } finally {
      setIsSubmitting(false);
    }
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
              Vou conduzir um onboarding guiado e usar a IA apenas para gerar seu treino final.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="border-b border-destructive/15 bg-destructive/5 px-5 py-3">
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div className="font-heading text-xs leading-5">{error}</div>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(77,92,255,0.04)_0%,rgba(255,255,255,0)_22%,rgba(255,255,255,0)_100%)] px-4 py-4">
        <div className="flex min-h-full flex-col gap-3">
          {messages.map((message) => {
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
                  <p className="font-heading text-sm leading-6">{message.content}</p>
                </div>
              </div>
            );
          })}

          {isSubmitting && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-2 text-muted-foreground shadow-sm">
                <LoaderCircle className="size-4 animate-spin" />
                <span className="font-heading text-xs">Gerando seu treino final...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border/70 bg-background/90 p-4">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Responda aqui para continuar seu onboarding"
            disabled={isSubmitting || showCreatedPlanModal}
            className="h-12 rounded-2xl border-border bg-secondary/60 px-4 font-heading text-sm shadow-none focus-visible:ring-primary/20"
          />

          <Button
            type="submit"
            size="icon-lg"
            disabled={isSubmitting || inputValue.trim().length === 0 || showCreatedPlanModal}
            className="size-12 rounded-2xl shadow-[0_16px_36px_-22px_rgba(77,92,255,0.8)]"
            aria-label="Enviar mensagem"
          >
            <ArrowUp className="size-5" />
          </Button>
        </div>
      </form>
    </div>
  );

  const createdPlanModal =
    showCreatedPlanModal && createdPlan ? (
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
                    {createdPlan.name}
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
              {createdPlan.summary}
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
                    key={`${day.weekDay}-${day.name}`}
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

  return (
    <>
      <div className="flex min-h-0 flex-1">{panelContent}</div>
      {createdPlanModal}
    </>
  );
}
