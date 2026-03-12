import { cookies } from "next/headers";
import { authClient } from "@/app/_lib/auth-client";

export async function getServerSession() {

  const cookieStore = await cookies();

  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await authClient.getSession({
    fetchOptions: {
      headers: {
        cookie: cookieHeader,
      },

      credentials: "include",

      cache: "no-store",
    },
  });

  return session;
}