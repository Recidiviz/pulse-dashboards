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
import ExclamationCircleIcon from "react-native-heroicons/solid/ExclamationCircleIcon";

import { Typography } from "./Typography";

type Props = {
  validationErrorType: string | null;
  className?: string;
};

const ProcessingErrorBanner = ({ validationErrorType, className }: Props) => {
  return (
    <View
      className={`flex-row items-center gap-3 rounded-xl bg-attention-light p-4 ${className ?? ""}`}
    >
      <View className="size-7 items-center justify-center rounded-full bg-attention-light-secondary">
        <ExclamationCircleIcon className="size-5 fill-attention" />
      </View>
      <View className="flex-1">
        <Typography className="text-sm font-medium text-attention">
          Processing Failed
        </Typography>
        <Typography className="text-xs text-secondary">
          {validationErrorType === "Length"
            ? "Less than 50 words identified, too short to generate results"
            : "Contact our support team for assistance"}
        </Typography>
      </View>
    </View>
  );
};

export default ProcessingErrorBanner;
