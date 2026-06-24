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

// Treatment tiles and entries render in a stable, data-driven order; array
// indices are safe React keys here.
/* eslint-disable react/no-array-index-key */

import { Text, View } from "@react-pdf/renderer";
import React from "react";

import { docTreatmentGroups } from "../derive";
import { BoldSubheading } from "../primitives/BoldSubheading";
import { Paragraph } from "../primitives/Paragraph";
import { UnderlinedHeading } from "../primitives/UnderlinedHeading";
import { useSAR } from "../SARContext";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { color, font, space } from "../tokens";
import { CommunityTreatmentTable } from "./CommunityTreatmentTable";

export const PriorTreatmentSection: React.FC<{ style?: PdfStyle }> = ({
  style = {},
}) => {
  const { sar } = useSAR();
  const groups = docTreatmentGroups(sar);
  const communitySummary = sar.priorTreatmentHistorySummary;
  const communityHistories = sar.priorTreatmentHistories ?? [];
  // Mirrors ReportPriorTreatmentHistory's `hasCommunity`: the community block
  // (summary + history table) is suppressed entirely when the defendant
  // declined to participate.
  const hasCommunity =
    !sar.defendantDeclinedToParticipate &&
    (communityHistories.length > 0 || !!communitySummary);
  if (!groups.length && !hasCommunity) return null;

  return (
    // The whole prior-treatment unit (heading + subheading + tile grid +
    // community-treatments paragraph) needs to land on one page — splitting
    // the tile grid mid-column produces an orphan row across the page break.
    <View style={style} wrap={false}>
      <UnderlinedHeading>
        Prior Treatment and Programming History
      </UnderlinedHeading>
      {groups.length ? (
        <>
          <BoldSubheading>
            Department of Corrections Incarceration Program Completion History
          </BoldSubheading>
          <Text>
            The defendant has participated in the following treatments/programs
            while previously incarcerated. Records limited to DOC-tracked
            programming only. This summary does not account for external,
            private, or non-DOC-affiliated services completed by the defendant.
          </Text>
          <View
            style={{ flexDirection: "row", gap: space[8], marginTop: space[6] }}
          >
            {groups.map((g, gi) => (
              <View
                key={gi}
                style={{
                  flex: 1,
                  backgroundColor: color.surface.section,
                  paddingVertical: space[8],
                  paddingHorizontal: space[10],
                }}
              >
                <Text
                  style={{
                    fontSize: font.size.md,
                    fontWeight: font.weight.bold,
                    marginBottom: space[6],
                  }}
                >
                  {g.title}
                </Text>
                {g.entries.map((e, ei) => (
                  <View
                    key={ei}
                    style={{ marginBottom: space[6], fontSize: font.size.sm }}
                  >
                    {e.date ? <Text>{e.date}</Text> : null}
                    <Text>{e.name}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </>
      ) : null}
      {hasCommunity ? (
        <View style={{ marginTop: space[8] }}>
          <BoldSubheading>Community Treatments and Programming</BoldSubheading>
          {communitySummary ? <Paragraph>{communitySummary}</Paragraph> : null}
          {communityHistories.length ? (
            <>
              <Paragraph>
                The defendant has shared that they participated in the following
                community based treatments/programs.
              </Paragraph>
              <CommunityTreatmentTable rows={communityHistories} />
              <Text style={{ fontSize: font.size.xxs, marginTop: space[2] }}>
                * The defendant&apos;s community treatment participation was
                verified through independent documentation (such as program
                certificates or discharge summaries), direct communication with
                the provider, or other reliable corroborating evidence.
              </Text>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};
