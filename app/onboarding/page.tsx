"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/_lib/auth-client";
import { Chat } from "@/app/_components/chat";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const session = await authClient.getSession();

      if (!session?.data?.user) {
        router.replace("/auth");
        return;
      }

      setLoading(false);
    };

    checkSession();
  }, [router]);

  if (loading) return <div>Carregando...</div>;

  return (
    <Chat embedded initialMessage="Quero começar a melhorar minha saúde!" />
  );
}