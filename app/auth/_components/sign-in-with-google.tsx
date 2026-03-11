"use client";

import { authClient } from "@/app/_lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignInWithGoogle() {
  const handleGoogleLogin = async () => {
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
    });

    if (error) {
      console.error(error.message);
    }
  };

  return <Button onClick={handleGoogleLogin}>Entrar com Google</Button>;
}