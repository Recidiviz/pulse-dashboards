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

import { CaseNoteSummarySegment } from "../model/types";
import { CitationTooltipContent } from "./CitationTooltipContent";

type Props = {
  segments: CaseNoteSummarySegment[];
  isInsideModal?: boolean;
};

/** Each cited phrase opens its citations in a tooltip on hover. */
export function CaseNoteSummaryWithTooltips({
  segments,
  isInsideModal,
}: Props) {
  return (
    <View className="flex-row flex-wrap items-baseline">
      {segments.map((segment, index) =>
        segment.citation ? (
          <Tooltip
            key={`${index}-${segment.content}`}
            content={<CitationTooltipContent citation={segment.citation} />}
            isInsideModal={isInsideModal}
          >
            <Typography
              variant="body-s-regular"
              className="border-b border-dotted border-primary text-primary"
            >
              {segment.content}
            </Typography>
          </Tooltip>
        ) : (
          <Typography
            key={`${index}-${segment.content}`}
            variant="body-s-regular"
          >
            {segment.content}
          </Typography>
        ),
      )}
    </View>
  );
}
