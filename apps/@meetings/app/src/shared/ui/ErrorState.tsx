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

import { View } from "react-native";

import PrimaryButton from "./PrimaryButton";
import { Typography } from "./Typography";

type Props = {
  message: string;
  onRetry: () => void;
};

export const ErrorState = ({ message, onRetry }: Props) => {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <Typography className="mb-4 text-center font-libre-baskerville text-3xl font-bold text-gray-900">
          Something went wrong
        </Typography>
        <Typography
          variant="body-m-regular"
          className="mb-6 text-center !text-gray-600"
        >
          {message}
        </Typography>
        <PrimaryButton onPress={onRetry} label="Try Again" />
      </View>
    </View>
  );
};
