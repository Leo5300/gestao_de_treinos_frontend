import { cookies } from "next/headers";
import { authClient } from "@/app/_lib/auth-client";

export async function getServerSession() {
  const cookieStore = cookies();

  const session = await authClient.getSession({
    fetchOptions: {
      headers: {
        cookie: cookieStore.toString(),
      },
      credentials: "include",
      cache: "no-store",
    },
  });

  return session;
}