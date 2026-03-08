import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getHomeData, getUserTrainData } from "@/app/_lib/api/fetch-generated";
import dayjs from "dayjs";
import { Chat } from "@/app/_components/chat";

export default async function OnboardingPage() {
  const headerStore = await headers();

  const session = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/session`,
    {
      headers: {
        cookie: headerStore.get("cookie") ?? "",
      },
      cache: "no-store",
    }
  ).then((res) => res.json());

  if (!session?.user) redirect("/auth");

  const [homeData, trainData] = await Promise.all([
    getHomeData(dayjs().format("YYYY-MM-DD")),
    getUserTrainData(),
  ]);

  if (
    homeData.status === 200 &&
    trainData.status === 200 &&
    homeData.data.activeWorkoutPlanId &&
    trainData.data
  ) {
    redirect("/");
  }

  return (
    <Chat embedded initialMessage="Quero começar a melhorar minha saúde!" />
  );
}