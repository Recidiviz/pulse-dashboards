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

// Numbered strategy items render from a data-driven array in stable order;
// array indices are safe React keys here.
/* eslint-disable react/no-array-index-key */

import { Text, View } from "@react-pdf/renderer";
import React from "react";

import { DECLINED_TEXT } from "../../SentencingAssessmentReport.constants";
import { sectionSkipped, splitParagraphs } from "../derive";
import { Banner } from "../primitives/Banner";
import { HomeIcon } from "../primitives/icons/HomeIcon";
import { NumberedItem } from "../primitives/NumberedItem";
import { Paragraph } from "../primitives/Paragraph";
import { UnderlinedHeading } from "../primitives/UnderlinedHeading";
import { useSAR } from "../SARContext";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { border, font, space } from "../tokens";

export const RecommendationAndPlan: React.FC<{ style?: PdfStyle }> = ({
  style = {},
}) => {
  const { sar } = useSAR();

  // Mirror the DOM report (ReportRecommendation): a declined defendant gets a
  // fixed fallback line; an explicitly skipped section is omitted entirely;
  // otherwise render whichever strategy groups have content.
  if (sar.defendantDeclinedToParticipate) {
    return (
      <View style={style}>
        <UnderlinedHeading>
          Recommendation and Supervision Plan
        </UnderlinedHeading>
        <Paragraph>{DECLINED_TEXT}</Paragraph>
      </View>
    );
  }

  if (sectionSkipped(sar, "recommendation")) return null;

  const homePlan = sar.homePlan;
  const strategies = splitParagraphs(sar.communityStrategyRecommendation);
  const institutionalPlan = splitParagraphs(
    sar.institutionalStrategyRecommendation,
  );
  const hasCommunity = !!(sar.communityStrategyRecommendation || homePlan);
  const hasInstitutional = !!sar.institutionalStrategyRecommendation;
  if (!hasCommunity && !hasInstitutional) return null;

  // Build the banners in render order so the heading can be kept attached to
  // the first one (community when present, else institutional).
  const banners: React.ReactElement[] = [];
  if (hasCommunity) {
    banners.push(
      <Banner title="Community Strategies" key="community">
        {strategies.map((s, i) => (
          <NumberedItem key={i} index={i + 1}>
            {s}
          </NumberedItem>
        ))}
        {homePlan ? (
          <View
            style={{
              marginTop: space[6],
              padding: space[16],
              borderWidth: border.width.regular,
              borderRadius: border.radius.sm,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space[4],
              }}
            >
              <View style={{ width: 10, height: 10, marginRight: space[6] }}>
                <HomeIcon />
              </View>
              <Text
                style={{
                  fontSize: font.size.md,
                  fontWeight: font.weight.bold,
                  marginBottom: space[2],
                }}
              >
                Home Plan
              </Text>
            </View>
            <Paragraph>{homePlan}</Paragraph>
          </View>
        ) : null}
      </Banner>,
    );
  }
  if (institutionalPlan.length) {
    banners.push(
      <Banner title="Institutional Strategies" key="institutional">
        {institutionalPlan.map((s, i) => (
          <NumberedItem key={i} index={i + 1}>
            {s}
          </NumberedItem>
        ))}
      </Banner>,
    );
  }

  return (
    <View style={style}>
      {/* Keep the heading attached to the first banner so it can't orphan at a
          page bottom while the (wrap=false) banner jumps to the next page. */}
      <View wrap={false}>
        <UnderlinedHeading>
          Recommendation and Supervision Plan
        </UnderlinedHeading>
        {banners[0]}
      </View>
      {banners.slice(1)}
    </View>
  );
};
