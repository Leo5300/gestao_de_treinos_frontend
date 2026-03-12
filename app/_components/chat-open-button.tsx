"use client";

import { Sparkles } from "lucide-react";
import { useQueryStates, parseAsBoolean, parseAsString } from "nuqs";
import { Button } from "@/components/ui/button";

export function ChatOpenButton() {
  const [, setChatParams] = useQueryStates({
    chat_open: parseAsBoolean.withDefault(false),
    chat_initial_message: parseAsString,
  });

  return (
    <Button
      type="button"
      onClick={() => setChatParams({ chat_open: true })}
      size="icon-lg"
      className="size-14 rounded-full border border-primary/15 bg-primary shadow-[0_16px_34px_-20px_rgba(77,92,255,0.85)] hover:bg-primary/95"
      aria-label="Abrir Coach AI"
    >
      <Sparkles className="size-6 text-primary-foreground" />
    </Button>
  );
}
