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

import clsx from "clsx";
import { format } from "date-fns";
import { View } from "react-native";
import SparklesIcon from "react-native-heroicons/solid/SparklesIcon";

import { Tooltip } from "~@meetings/app/shared/ui/Tooltip";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  size?: "default" | "small";
  isInsideModal?: boolean;
  lastUpdatedAt?: Date;
};

export function CaseNoteSummaryAiGeneratedLabel({
  size = "default",
  isInsideModal,
  lastUpdatedAt,
}: Props) {
  const isSmall = size === "small";

  return (
    <Tooltip
      contentClassName="!p-3"
      isInsideModal={isInsideModal}
      content={
        <Typography
          variant="body-s-regular"
          className="text-center !text-on-brand"
        >
          AI generated from the last 90 days of case notes
          {lastUpdatedAt && ` (as of ${format(lastUpdatedAt, "MMM d, yyyy")})`}
        </Typography>
      }
    >
      <View className="flex-row items-center gap-1">
        <SparklesIcon
          className={clsx(isSmall ? "size-3.5" : "size-4", "text-brand")}
        />
        <Typography
          variant={isSmall ? "caption-s-medium" : "body-s-regular"}
          className="!text-brand"
        >
          AI generated
        </Typography>
      </View>
    </Tooltip>
  );
}
