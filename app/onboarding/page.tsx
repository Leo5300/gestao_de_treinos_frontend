"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/_lib/auth-client";
import { Chat } from "@/app/_components/chat";

type SessionUser = {
  id?: string;
  email?: string;
  name?: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await authClient.getSession();

        if (!session?.data?.user) {
          router.replace("/auth");
          return;
        }

        setUser(session.data.user);
      } catch (error) {
        console.error("Erro ao buscar sessão:", error);
        router.replace("/auth");
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Carregando...
      </div>
    );
  }

  if (!user) return null;

  return (
    <Chat embedded initialMessage="Quero começar a melhorar minha saúde!" />
  );
}