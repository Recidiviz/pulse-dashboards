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

import { Tooltip } from "~@meetings/app/shared/ui/Tooltip";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import NotReviewedIcon from "../assets/not-reviewed.svg";
import ReviewedIcon from "../assets/reviewed.svg";

export function ReviewIndicator({ isApproved }: { isApproved: boolean }) {
  const icon = isApproved ? (
    <ReviewedIcon className="size-3" />
  ) : (
    <NotReviewedIcon className="size-3" />
  );

  return (
    <Tooltip
      inline
      contentClassName="!p-2"
      content={
        <Typography variant="body-s-regular" className="!text-on-brand">
          {isApproved ? "Reviewed" : "Not yet reviewed"}
        </Typography>
      }
    >
      <View>{icon}</View>
    </Tooltip>
  );
}
