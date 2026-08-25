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

import { Fragment } from "react";

import { Tooltip } from "~@meetings/app/shared/ui/Tooltip";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { CaseNoteSummarySegment } from "../model/types";
import { CitationTooltipContent } from "./CitationTooltipContent";

type Props = {
  segments: CaseNoteSummarySegment[];
  isInsideModal?: boolean;
};

/**
 * Each cited phrase opens its citations in a tooltip
 */
export function CaseNoteSummaryWithTooltips({
  segments,
  isInsideModal,
}: Props) {
  return (
    <Typography variant="body-s-regular">
      {segments.map(({ content, citation }, index) => {
        const key = `${index}-${content}`;

        if (!citation) return <Fragment key={key}>{content}</Fragment>;

        // A cited fragment carries the space that separates it from the phrase
        // before it (" at Acme Corp"). That space stays outside the trigger, so
        // the underline and the hover target both start at the first word.
        const lead = content.match(/^\s+/)?.[0] ?? "";

        return (
          <Fragment key={key}>
            {lead}
            <Tooltip
              inline
              content={<CitationTooltipContent citation={citation} />}
              isInsideModal={isInsideModal}
            >
              <Typography className="border-b border-dotted border-primary text-primary">
                {content.slice(lead.length)}
              </Typography>
            </Tooltip>
          </Fragment>
        );
      })}
    </Typography>
  );
}
