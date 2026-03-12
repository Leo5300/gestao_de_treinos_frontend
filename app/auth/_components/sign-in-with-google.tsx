"use client";

import { useState } from "react";
import Image from "next/image";
import { authClient } from "@/app/_lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignInWithGoogle() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGoogleLogin = async () => {
    if (isRedirecting) {
      return;
    }

    setIsRedirecting(true);

    const callbackURL = new URL("/", window.location.origin).toString();

    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });

    if (error) {
      setIsRedirecting(false);
      console.error(error.message);
    }
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      disabled={isRedirecting}
      className="h-[42px] rounded-full bg-white px-6 text-black shadow-[0_18px_38px_-24px_rgba(0,0,0,0.55)] hover:bg-white/92"
    >
      <Image
        src="/google-icon.svg"
        alt=""
        width={16}
        height={16}
        className="shrink-0"
      />
      {isRedirecting ? "Abrindo Google..." : "Entrar com Google"}
    </Button>
  );
}
