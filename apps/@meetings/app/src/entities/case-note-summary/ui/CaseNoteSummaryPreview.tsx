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

import { Typography } from "~@meetings/app/shared/ui/Typography";

import { toWords } from "../lib/toWords";
import { CaseNoteSummarySegment } from "../model/types";

type Props = {
  segments: CaseNoteSummarySegment[];
  numberOfLines?: number;
};

/** Inert, truncatable rendering of the summary. */
export function CaseNoteSummaryPreview({ segments, numberOfLines = 2 }: Props) {
  return (
    <Typography variant="body-s-regular" numberOfLines={numberOfLines}>
      {toWords(segments).map(({ text, isCited }, index) => (
        <Typography
          key={`${index}-${text}`}
          className={clsx(
            "leading-5",
            isCited && "text-primary underline decoration-dotted",
          )}
        >
          {text}
        </Typography>
      ))}
    </Typography>
  );
}
