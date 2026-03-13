import type { GetUserTrainData200 } from "@/app/_lib/api/fetch-generated";
import { CoachAiChat } from "@/app/_components/coach-ai-chat";
import { GuidedOnboardingChat } from "@/app/_components/guided-onboarding-chat";

interface ChatProps {
  embedded?: boolean;
  initialMessage?: string;
  onboarding?: boolean;
  initialTrainData?: GetUserTrainData200;
}

export function Chat({
  embedded = false,
  initialMessage,
  onboarding = false,
  initialTrainData = null,
}: ChatProps) {
  // Se o onboarding voltar a ser um chat totalmente conduzido pela IA,
  // remova o componente guiado abaixo e volte a usar CoachAiChat aqui.
  if (onboarding) {
    return (
      <GuidedOnboardingChat
        embedded={embedded}
        initialMessage={initialMessage}
        initialTrainData={initialTrainData}
      />
    );
  }

  return <CoachAiChat embedded={embedded} initialMessage={initialMessage} />;
}
