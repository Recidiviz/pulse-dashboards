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

import { compact, uniq } from "lodash";
import { useEffect } from "react";
import { View } from "react-native";

import { useAnalytics } from "~@meetings/app/shared/analytics";
import { Person } from "~@meetings/app/shared/api";
import { Tooltip } from "~@meetings/app/shared/ui/Tooltip";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { toWords } from "../lib/toWords";
import { CaseNoteSummarySegment } from "../model/types";
import { CitationTooltipContent } from "./CitationTooltipContent";

type Props = {
  segments: CaseNoteSummarySegment[];
  person: Person;
  isInsideModal?: boolean;
};

/**
 * Each cited phrase opens its citations in a tooltip
 */
export function CaseNoteSummaryWithTooltips({
  segments,
  person,
  isInsideModal,
}: Props) {
  const { track } = useAnalytics();

  useEffect(() => {
    track("cni_summary_viewed", {
      personId: person.personId.toString(),
      categories: uniq(compact(segments.map((s) => s.category))),
      isInsideModal: !!isInsideModal,
    });
    // Empty dependency array ensures this effect only runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View className="flex-row flex-wrap items-baseline">
      {toWords(segments).map(({ text, segmentIndex, isCited }, index) => {
        const citation = isCited ? segments[segmentIndex].citation : undefined;
        const key = `${index}-${text}`;

        if (citation) {
          return (
            <Tooltip
              key={key}
              content={<CitationTooltipContent citation={citation} />}
              isInsideModal={isInsideModal}
              onOpenChange={(open) => {
                if (open) {
                  track("cni_summary_citation_viewed", {
                    personId: person.personId.toString(),
                    category: segments[segmentIndex].category,
                    isInsideModal: !!isInsideModal,
                  });
                }
              }}
            >
              <Typography
                variant="body-s-regular"
                className="border-b border-dotted border-primary text-primary"
              >
                {text}
              </Typography>
            </Tooltip>
          );
        }

        return (
          <Typography key={key} variant="body-s-regular">
            {text}
          </Typography>
        );
      })}
    </View>
  );
}
