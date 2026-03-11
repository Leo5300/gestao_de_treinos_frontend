import type { Metadata } from "next";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Chat } from "@/app/_components/chat";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIT.AI",
  description: "O app que vai transformar a forma como você treina.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <NuqsAdapter>
          {children}

          <Suspense fallback={null}>
            <Chat />
          </Suspense>

        </NuqsAdapter>
      </body>
    </html>
  );
}