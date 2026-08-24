// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import { Image, Platform, ScrollView, View } from "react-native";

import { useGetUser, useUserContext } from "~@meetings/app/entities/user";
import WordmarkSvg from "~@meetings/app/shared/assets/icons/wordmark.svg";
import { RootStackParamList } from "~@meetings/app/shared/config";
import { Button } from "~@meetings/app/shared/ui/Button";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import ProTip4LeftImage from "../assets/pro-tip-4-left.png";
import ProTip4RightImage from "../assets/pro-tip-4-right.png";
import { useOnboardingStore } from "../model/store";
import { useCompleteOnboarding } from "../model/useCompleteOnboarding";
import { DescriptionContainer } from "./DescriptionContainer";

export function ProTip4() {
  const { hasSupervisionAccess } = useUserContext();
  const navigation = useNavigation<DrawerNavigationProp<RootStackParamList>>();
  const { data: userData } = useGetUser();
  const { mutate: completeOnboarding } = useCompleteOnboarding();
  const reset = useOnboardingStore((state) => state.reset);

  const handleFinishSetup = () => {
    const onNavigate = () => {
      if (hasSupervisionAccess) {
        navigation.navigate("ClientsRoot", { screen: "Clients" });
      } else {
        navigation.navigate("ResidentsRoot", { screen: "Residents" });
      }
    };

    if (userData?.hasSeenOnboarding) {
      onNavigate();
      reset();
    } else {
      completeOnboarding(undefined, {
        onSuccess: () => {
          onNavigate();
          reset();
        },
      });
    }
  };

  return (
    <View className="flex size-full flex-1 flex-col gap-5 md:flex-row-reverse">
      <View className="flex flex-1 items-center justify-center rounded-[20px] bg-secondary">
        <WordmarkSvg className="absolute left-[36px] top-[30px] h-8 w-[116px] md:left-[30px] md:h-10" />
        {Platform.OS === "web" && (
          <View className="w-full flex-1 overflow-hidden p-5">
            <View className="mt-auto flex flex-row justify-between gap-4 overflow-auto">
              <View className="flex flex-col">
                <Typography
                  variant="heading-5"
                  className="mb-1 !text-attention"
                >
                  Instead of
                </Typography>
                <Typography variant="body-s-regular" className="mb-3">
                  silently taking a piece of paper
                </Typography>
                <Image
                  source={ProTip4LeftImage}
                  className="aspect-[261/180] flex-1 rounded-[20px] md:aspect-[261/340]"
                />
              </View>
              <View className="flex flex-col">
                <Typography variant="heading-5" className="mb-1 !text-brand">
                  Try this
                </Typography>
                <Typography
                  variant="body-s-regular"
                  className="mb-3 text-transparent"
                >
                  -
                </Typography>
                <Image
                  source={ProTip4RightImage}
                  className="aspect-[261/180] flex-1 rounded-[20px] md:aspect-[261/340]"
                />
              </View>
            </View>
          </View>
        )}
        {Platform.OS !== "web" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{
              alignSelf: "stretch",
              flex: 1,
              padding: 20,
            }}
            contentContainerStyle={{
              flexDirection: "row",
              gap: 16,
              marginTop: "auto",
              paddingRight: 20,
            }}
          >
            <View className="flex w-[261px] flex-col">
              <Typography variant="heading-5" className="mb-1 !text-attention">
                Instead of
              </Typography>
              <Typography variant="body-s-regular" className="mb-3">
                silently taking a piece of paper
              </Typography>
              <Image
                source={ProTip4LeftImage}
                className="h-[180px] w-[261px] rounded-[20px]"
                resizeMode="cover"
              />
            </View>
            <View className="flex w-[261px] flex-col">
              <Typography variant="heading-5" className="mb-1 !text-brand">
                Try this
              </Typography>
              <Typography
                variant="body-s-regular"
                className="mb-3 text-transparent"
              >
                -
              </Typography>
              <Image
                source={ProTip4RightImage}
                className="h-[180px] w-[261px] rounded-[20px]"
                resizeMode="cover"
              />
            </View>
          </ScrollView>
        )}
      </View>
      <View className="flex flex-1 flex-col justify-center">
        <Typography variant="body-m-medium" className="mb-3">
          PRO Tip 4
        </Typography>
        <Typography variant="heading-4" className="mb-2 max-w-[261px]">
          Narrate the unseen.
        </Typography>
        <DescriptionContainer>
          <Typography
            variant="body-m-regular"
            className="mb-3 max-w-[480px] text-secondary"
          >
            Recidiviz Meetings has great ears, but it doesn't have eyes. If a
            client hands you a document, completes a drug screen, or shows you
            something physical, simply state what is happening out loud so it
            makes it into your case notes.
          </Typography>
        </DescriptionContainer>
        <Button
          variant="primary"
          onPress={handleFinishSetup}
          className="mt-auto w-full md:mt-0 md:w-fit"
        >
          Finish Setup
        </Button>
      </View>
    </View>
  );
}
