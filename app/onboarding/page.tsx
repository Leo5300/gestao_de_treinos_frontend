"use client";

export const dynamic = "force-dynamic";

import { Chat } from "@/app/_components/chat";

export default function OnboardingPage() {
  return (
    <Chat embedded initialMessage="Quero começar a melhorar minha saúde!" />
  );
}

