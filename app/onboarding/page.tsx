"use client";

import { Suspense } from "react";
import { Chat } from "@/app/_components/chat";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Chat embedded initialMessage="Quero começar a melhorar minha saúde!" />
    </Suspense>
  );
}