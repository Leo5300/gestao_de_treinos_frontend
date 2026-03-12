"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import { useQueryStates, parseAsBoolean, parseAsString } from "nuqs";

import { Sparkles, X, ArrowUp, CheckCircle2 } from "lucide-react";

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
  onboarding?: boolean;
}

export function Chat({
  embedded = false,
  initialMessage,
  onboarding = false,
}: ChatProps) {

  const router = useRouter();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const initialSent = useRef(false);

  const [queryState, setQueryState] = useQueryStates({
    chat_open: parseAsBoolean.withDefault(false),
    chat_initial_message: parseAsString,
  });

  const [checkingPlan, setCheckingPlan] = useState(false);
  const [planCreated, setPlanCreated] = useState(false);

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
      behavior: messages.length > 1 ? "smooth" : "auto",
    });
  }, [messages]);

  useEffect(() => {

    if (
      embedded &&
      initialMessage &&
      messages.length === 0 &&
      !initialSent.current
    ) {
      initialSent.current = true;

      sendMessage({
        text: initialMessage,
      });
    }

  }, [embedded, initialMessage, messages.length, sendMessage]);

  async function checkIfPlanWasCreated() {

    try {

      setCheckingPlan(true);

      const today = dayjs().format("YYYY-MM-DD");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/home/${today}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) return;

      const data = await response.json();

      if (data?.activeWorkoutPlanId) {

        setPlanCreated(true);

        setTimeout(() => {
          router.replace("/");
          router.refresh();
        }, 1500);
      }

    } catch (error) {

      console.error("Erro ao verificar criação do plano:", error);

    } finally {

      setCheckingPlan(false);

    }
  }

  useEffect(() => {

    if (!onboarding) return;
    if (messages.length === 0) return;
    if (status !== "ready") return;
    if (planCreated) return;
    if (checkingPlan) return;

    checkIfPlanWasCreated();

  }, [status]);

  function onSubmit(values: FormSchema) {

    sendMessage({
      text: values.message,
    });

    form.reset();
  }

  if (!embedded && !queryState.chat_open) {

    return (
      <button
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-white shadow-lg hover:bg-blue-700 transition"
        onClick={() => setQueryState({ chat_open: true })}
      >
        <Sparkles size={18} />
        Coach AI
      </button>
    );
  }

  return (
    <div
      className={
        embedded
          ? "flex h-full w-full flex-col rounded-xl border bg-white shadow-lg"
          : "fixed bottom-6 right-6 z-50 flex h-[500px] w-[350px] flex-col rounded-xl border bg-white shadow-lg"
      }
    >

      <div className="flex items-center justify-between border-b px-4 py-3">

        <div className="flex items-center gap-2">

          <Sparkles className="text-blue-600" size={18} />

          <span className="font-semibold">Coach AI</span>

        </div>

        {!embedded && (
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setQueryState({ chat_open: false })}
          >
            <X size={18} />
          </button>
        )}

      </div>

      {planCreated && (
        <div className="border-b bg-green-50 px-4 py-3 animate-in fade-in">

          <div className="flex items-start gap-2">

            <CheckCircle2 className="mt-0.5 size-5 text-green-600" />

            <div className="flex flex-col gap-2">

              <p className="text-sm font-medium text-green-800">
                Seu treino foi criado com sucesso.
              </p>

              <p className="text-xs text-green-700">
                Você será levado para a tela principal.
              </p>

              <button
                onClick={() => {
                  router.replace("/");
                  router.refresh();
                }}
                className="w-fit rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
              >
                Ir para minha home
              </button>

            </div>

          </div>

        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">

        <div className="flex flex-col gap-4 animate-in fade-in duration-300">

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
                  ) : null,
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

          {status === "streaming" && (
            <div className="flex items-center gap-2 text-gray-500 animate-pulse">
              <Sparkles size={14} />
              Coach AI está pensando...
            </div>
          )}

          <div ref={messagesEndRef} />

        </div>

      </div>

      {!planCreated && (

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
            className="flex items-center justify-center rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <ArrowUp size={18} />
          </button>

        </form>

      )}

    </div>
  );
}