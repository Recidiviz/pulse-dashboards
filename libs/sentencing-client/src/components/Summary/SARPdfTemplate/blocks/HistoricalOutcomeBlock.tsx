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

// Tag chips and legend rows render from stable data-driven arrays; array
// indices are safe React keys here.
/* eslint-disable react/no-array-index-key */

import { Link, Text, View } from "@react-pdf/renderer";
import React from "react";

import { formatOffenseLabel } from "../../../../utils/utils";
import { GenderToDisplayName } from "../../../CaseDetails/constants";
import { buildInsightsFootnoteText } from "../../insightsUtils";
import { keyFindingText, sentenceDistributionRows } from "../derive";
import { BoldSubheading } from "../primitives/BoldSubheading";
import { Chip } from "../primitives/Chip";
import { FlagIcon } from "../primitives/icons/FlagIcon";
import { Paragraph } from "../primitives/Paragraph";
import { UnderlinedHeading } from "../primitives/UnderlinedHeading";
import { useSAR } from "../SARContext";
import type { LegendGlyph, PdfStyle } from "../SARPdfTemplate.types";
import { color, font, space } from "../tokens";
import { AverageTimeServed } from "./AverageTimeServed";
import { SentenceDistribution } from "./SentenceDistribution";

const BUCKET_TO_RISK_CHIP: Record<number, string> = {
  0: "Low Risk Score",
  1: "Moderate Risk Score",
  2: "High Risk Score",
  3: "Very High Risk Score",
};

// Maps each disposition label to a slice/legend glyph, matching the reference:
// non-incarceration dispositions use the solid gray ramp; incarceration buckets
// escalate through textures (dots -> crosshatch -> plus) to solid black at 6+.
const GLYPH_BY_LABEL: Record<string, LegendGlyph> = {
  "Treatment Court/Deferred Prosecution": "stripes",
  Probation: "light",
  "Court-Ordered Treatment": "mid",
  "Suspended Sentence": "dark",
  "< 1 Year Incarceration": "dots",
  "1 Year Incarceration": "dots",
  "1-2 Years Incarceration": "crosshatch",
  "3-5 Years Incarceration": "plus",
  "6+ Years Incarceration": "black",
};

export const HistoricalOutcomeBlock: React.FC<{ style?: PdfStyle }> = ({
  style = {},
}) => {
  const { sar, insight } = useSAR();
  // Hidden when the defendant declined (the section requires a risk score) or
  // when no matching insight exists, matching the DOM report.
  if (sar.defendantDeclinedToParticipate || !insight) return null;

  const tags = [
    GenderToDisplayName[insight.gender],
    BUCKET_TO_RISK_CHIP[insight.assessmentScoreBucketStart],
    insight.offenseCategory ?? formatOffenseLabel(insight.offense),
  ].filter(Boolean) as string[];

  const items = sentenceDistributionRows(insight).map((row) => ({
    label: row.label,
    pct: row.pct,
    glyph: GLYPH_BY_LABEL[row.label] ?? "mid",
  }));

  const keyFinding = keyFindingText(insight);

  return (
    <View style={style}>
      <UnderlinedHeading>Historical Outcome Reference</UnderlinedHeading>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space[4],
        }}
      >
        <FlagIcon height={7} width={7} />
        <Text
          style={{
            fontSize: font.size.base,
            lineHeight: font.lineHeight.tight,
          }}
        >
          The following data represents historical trends, which do not predict
          or guarantee the outcome of any individual case.
        </Text>
      </View>

      {tags.length ? (
        <View
          style={{
            flexDirection: "row",
            marginTop: space[4],
            marginBottom: space[8],
          }}
          wrap={false}
        >
          {tags.map((t, i) => (
            <Chip key={i} style={{ marginRight: space[4] }}>
              {t}
            </Chip>
          ))}
        </View>
      ) : null}

      <SentenceDistribution
        data={{
          numRecords: insight.dispositionNumRecords,
          items,
          context: {
            gender: insight.gender,
            assessmentScoreBucketStart: insight.assessmentScoreBucketStart,
            offense: insight.offense,
            offenseCategory: insight.offenseCategory,
          },
        }}
      />

      <AverageTimeServed />

      <Text
        style={{
          fontSize: font.size.xs,
          fontWeight: font.weight.semibold,
          color: color.text.default,
          lineHeight: font.lineHeight.tight,
          marginTop: space[6],
        }}
      >
        {buildInsightsFootnoteText(
          insight.dispositionNumRecords,
          insight.gender,
          insight.assessmentScoreBucketStart,
        )}
      </Text>
      <Text
        style={{
          fontSize: font.size.base,
          marginTop: space[8],
          color: color.text.default,
        }}
      >
        Visit{" "}
        <Link
          style={{
            color: color.text.default,
            fontWeight: font.weight.semibold,
          }}
          href="www.courts.mo.gov/sentencing-calc"
        >
          www.courts.mo.gov/sentencing-calc
        </Link>{" "}
        to further explore the range of time a defendant may serve in prison
        based on statutory requirements and regulations.
      </Text>

      {keyFinding ? (
        <View style={{ marginTop: space[8] }}>
          <BoldSubheading style={{ fontSize: font.size.xl }}>
            Key Finding
          </BoldSubheading>
          <Paragraph>{keyFinding}</Paragraph>
        </View>
      ) : null}
    </View>
  );
};
