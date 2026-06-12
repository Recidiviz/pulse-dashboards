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

import { Image, TouchableOpacity, View } from "react-native";

import WordmarkSvg from "~@meetings/app/shared/assets/icons/wordmark.svg";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import ProTip4LeftImage from "../assets/pro-tip-4-left.png";
import ProTip4RightImage from "../assets/pro-tip-4-right.png";
import { DescriptionContainer } from "./DescriptionContainer";

export function ProTip4() {
  return (
    <View className="flex size-full flex-1 flex-col gap-5 md:flex-row-reverse">
      <View className="flex flex-1 items-center justify-center rounded-[20px] bg-secondary">
        <WordmarkSvg className="absolute left-[36px] top-[30px] h-8 w-[116px] md:left-[30px] md:h-10" />
        <View className="w-full flex-1 overflow-hidden p-5">
          <View className="mt-auto flex flex-row justify-between gap-4 overflow-auto">
            <View className="flex flex-col">
              <Typography className="mb-1 text-[18px] font-semibold leading-[26px] text-attention">
                Instead of
              </Typography>
              <Typography className="mb-3 text-sm font-normal text-secondary">
                silently taking a piece of paper
              </Typography>
              <Image
                source={ProTip4LeftImage}
                className="aspect-[261/180] flex-1 rounded-[20px] md:aspect-[261/340]"
              />
            </View>
            <View className="flex flex-col">
              <Typography className="mb-1 text-[18px] font-semibold leading-[26px] text-brand">
                Try this
              </Typography>
              <Typography className="mb-3 text-sm font-normal text-transparent">
                -
              </Typography>
              <Image
                source={ProTip4RightImage}
                className="aspect-[261/180] flex-1 rounded-[20px] md:aspect-[261/340]"
              />
            </View>
          </View>
        </View>
      </View>
      <View className="flex flex-1 flex-col justify-center">
        <Typography className="mb-3 text-base font-medium">
          PRO Tip 4
        </Typography>
        <Typography className="mb-2 max-w-[261px] text-xl font-semibold">
          Narrate the unseen.
        </Typography>
        <DescriptionContainer>
          <Typography className="mb-3 max-w-[480px] text-base font-normal text-secondary">
            Recidiviz Meetings has great ears, but it doesn't have eyes. If a
            client hands you a document, completes a drug screen, or shows you
            something physical, simply state what is happening out loud so it
            makes it into your case notes.
          </Typography>
        </DescriptionContainer>
        <TouchableOpacity className="mt-auto w-full rounded-full bg-brand px-5 py-3 md:mt-0 md:w-fit">
          <Typography className="text-center text-base font-semibold leading-[18px] text-on-brand">
            Finish Setup
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
}
