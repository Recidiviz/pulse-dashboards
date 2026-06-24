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

import { Document, Page } from "@react-pdf/renderer";
import React from "react";

import { DefendantStatement } from "./blocks/DefendantStatement";
import { HistoricalOutcomeBlock } from "./blocks/HistoricalOutcomeBlock";
import { KeyConsiderationsBlock } from "./blocks/KeyConsiderationsBlock";
import { LearnMorePill } from "./blocks/LearnMorePill";
import { OffenderInfoSection } from "./blocks/OffenderInfoSection";
import { Offenses } from "./blocks/Offenses";
import { OrasAssessment } from "./blocks/OrasAssessment";
import { PriorTreatmentSection } from "./blocks/PriorTreatmentSection";
import { RecommendationAndPlan } from "./blocks/RecommendationAndPlan";
import { RequestedOfSection } from "./blocks/RequestedOfSection";
import { SARFooter } from "./blocks/SARFooter";
import { SARHeader } from "./blocks/SARHeader";
import { SignatureBlock } from "./blocks/SignatureBlock";
import { TopHeaderRow } from "./blocks/TopHeaderRow";
import { VictimImpact } from "./blocks/VictimImpact";
import { SARProvider } from "./SARContext";
import type { SAR, SARInsight } from "./SARPdfTemplate.types";
import { color, font, space } from "./tokens";

export interface SARPdfTemplateProps {
  /** The raw getSAR tRPC response. */
  sar: SAR;
  /** The getSARInsight response (Historical Outcome); null when none exists. */
  insight?: SARInsight | null;
}

// Uniform gap between top-level blocks, owned here by the page rather than by
// each block's first child. Passed down to every flowing block via `style`.
const blockSpacing = { marginBottom: space.blockGap };

/**
 * The whole report is one `<Page wrap>` holding an ordered, flat list of
 * section components — each reads its data from `useSAR()`. The page owns the
 * vertical rhythm: it passes a uniform `blockSpacing` margin down to every
 * flowing block, rather than letting a block's first child create the gap. The
 * layout engine paginates wherever content overflows, and the `fixed`
 * header/footer repeat on every physical page.
 */
export const SARPdfTemplate: React.FC<SARPdfTemplateProps> = ({
  sar,
  insight = null,
}) => (
  <SARProvider sar={sar} insight={insight}>
    <Document
      title={`Sentencing Assessment Report - ${sar.client?.fullName ?? "Unknown"}`}
      author="Missouri Department of Corrections"
    >
      <Page
        size="A4"
        style={{
          paddingTop: space.pageMargin.top,
          paddingBottom: space.pageMargin.bottom,
          paddingHorizontal: space.pageMargin.x,
          fontSize: font.size.md,
          fontFamily: font.family,
          color: color.text.default,
        }}
      >
        <SARHeader />
        <TopHeaderRow style={blockSpacing} />
        <RequestedOfSection style={blockSpacing} />
        <OffenderInfoSection style={blockSpacing} />
        <Offenses style={blockSpacing} />
        <KeyConsiderationsBlock style={blockSpacing} />
        <DefendantStatement style={blockSpacing} />
        <VictimImpact style={blockSpacing} />

        <OrasAssessment style={blockSpacing} />
        <PriorTreatmentSection style={blockSpacing} />
        <RecommendationAndPlan style={blockSpacing} />

        <HistoricalOutcomeBlock style={blockSpacing} />

        <SignatureBlock style={blockSpacing} />
        <LearnMorePill />

        <SARFooter />
      </Page>
    </Document>
  </SARProvider>
);
