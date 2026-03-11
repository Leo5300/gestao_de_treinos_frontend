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
    <Suspense fallback={<div>Carregando...</div>}>
      <Chat embedded initialMessage="Quero comecar a melhorar minha saude!" />
    </Suspense>
  );
}