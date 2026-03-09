import { createAuthClient } from "better-auth/react";

const baseURL =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_BASE_URL + "/api/auth"
    : "/api/auth";

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
  },
});