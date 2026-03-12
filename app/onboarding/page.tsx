import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Chat } from "@/app/_components/chat";
import { getServerSession } from "@/app/_lib/get-server-session";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getServerSession();

  if (!session.data?.user) {
    redirect("/auth");
  }

  return (
    <main className="min-h-svh bg-background p-4">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-2xl flex-col">
        <Suspense fallback={<div>Carregando...</div>}>
          <Chat
            embedded
            onboarding
            initialMessage="Quero montar meu primeiro treino. Faça apenas as perguntas necessárias, salve meus dados físicos e crie meu plano assim que tiver informações suficientes."
          />
        </Suspense>
      </div>
    </main>
  );
}