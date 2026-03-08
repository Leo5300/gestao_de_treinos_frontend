"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/_lib/auth-client";
import { Chat } from "@/app/_components/chat";

export default function OnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();

        if (!session?.data?.user) {
          router.replace("/auth");
          return;
        }

        setReady(true);
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        router.replace("/auth");
      }
    };

    checkSession();
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Carregando...
      </div>
    );
  }

  return (
    <Chat embedded initialMessage="Quero começar a melhorar minha saúde!" />
  );
}