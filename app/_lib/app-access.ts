import { redirect } from "next/navigation";
import type {
  GetUserTrainData200,
  getHomeDataResponse,
  getHomeDataResponseSuccess,
  getUserTrainDataResponse,
  getUserTrainDataResponseSuccess,
} from "@/app/_lib/api/fetch-generated";

const hasCompletePhysicalData = (trainData: GetUserTrainData200): boolean => {
  if (!trainData) {
    return false;
  }

  return (
    trainData.weightInGrams > 0 &&
    trainData.heightInCentimeters > 0 &&
    trainData.age > 0 &&
    trainData.bodyFatPercentage >= 0
  );
};

export const guardAppAccess = (
  homeData: getHomeDataResponse,
  trainData: getUserTrainDataResponse,
): {
  homeData: getHomeDataResponseSuccess["data"];
  trainData: NonNullable<getUserTrainDataResponseSuccess["data"]>;
} => {
  if (homeData.status === 401 || trainData.status === 401) {
    redirect("/auth");
  }

  if (homeData.status !== 200) {
    throw new Error("Failed to fetch home data");
  }

  if (trainData.status !== 200) {
    throw new Error("Failed to fetch user train data");
  }

  if (
    !homeData.data.activeWorkoutPlanId ||
    !hasCompletePhysicalData(trainData.data)
  ) {
    redirect("/onboarding");
  }

  return {
    homeData: homeData.data,
    trainData:
      trainData.data as NonNullable<getUserTrainDataResponseSuccess["data"]>,
  };
};
