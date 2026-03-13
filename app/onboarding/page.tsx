import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Chat } from "@/app/_components/chat";
import { getUserTrainData } from "@/app/_lib/api/fetch-generated";
import { getServerSession } from "@/app/_lib/get-server-session";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getServerSession();

  if (!session.data?.user) {
    redirect("/auth");
  }

  const trainData = await getUserTrainData();

  if (trainData.status === 401) {
    redirect("/auth");
  }

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(77,92,255,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,248,252,1)_100%)] p-4">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-3xl flex-col gap-4">
        <div className="flex flex-col gap-3 px-1 pt-2">
          <span className="w-fit rounded-full border border-primary/12 bg-primary/8 px-3 py-1 font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Onboarding AI
          </span>

          <div className="max-w-2xl">
            <h1 className="font-heading text-[32px] font-semibold leading-[0.98] text-foreground">
              Seu treino comeca aqui.
            </h1>

            <p className="mt-3 font-heading text-sm leading-6 text-muted-foreground">
              Responda o necessario, deixe o Coach AI montar seu plano e siga
              direto para a home quando tudo estiver pronto.
            </p>
          </div>
        </div>

        <Suspense fallback={<div>Carregando...</div>}>
          <div className="min-h-0 flex-1">
            <Chat
              embedded
              onboarding
              initialTrainData={trainData.status === 200 ? trainData.data : null}
              initialMessage="Quero montar meu primeiro treino. Faca apenas as perguntas necessarias, salve meus dados fisicos e crie meu plano assim que tiver informacoes suficientes."
            />
          </div>
        </Suspense>
      </div>
    </main>
  );
}
