import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Chat } from "@/app/_components/chat";
import { authClient } from "@/app/_lib/auth-client";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session.data?.user) {
    redirect("/auth");
  }

  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Chat embedded initialMessage="Quero comecar a melhorar minha saude!" />
    </Suspense>
  );
}
