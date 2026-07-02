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

// ORAS domains render from a stable, order-stable config array; array indices
// are safe React keys here.
/* eslint-disable react/no-array-index-key */

import { View } from "@react-pdf/renderer";
import React from "react";

import { formatLongDate } from "../../../../utils/utils";
import { getAssessmentTypeShortName } from "../../../OffenderAssessment/assessmentTypeUtils";
import {
  getDomainsForAssessmentType,
  shouldShowOrasContent,
} from "../../../OffenderAssessment/utils";
import { Paragraph } from "../primitives/Paragraph";
import { UnderlinedHeading } from "../primitives/UnderlinedHeading";
import { useActiveFeatureVariants, useSAR } from "../SARContext";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { OrasDomainSection } from "./OrasDomainSection";

/**
 * "Offender Risk Assessment" section — heading + one banner per ORAS domain
 * for this assessment type. Responsivity Issues & Barriers is just another
 * domain config entry (no risk pip), so it falls out of the same map.
 *
 * When the defendant declined to participate, this mirrors the DOM report
 * (ReportOffenderAssessment): the title drops the ORAS type, the "Administered
 * By" note is omitted, the defendant statement (the officer's contact-attempt
 * notes) shows under the heading, and only the Criminal History domain renders
 * — `getDomainsForAssessmentType(null)` returns just that config, and
 * `OrasDomainSection` already suppresses the risk pip when declined.
 */
export const OrasAssessment: React.FC<{ style?: PdfStyle }> = ({
  style = {},
}) => {
  const { sar } = useSAR();
  const activeFeatureVariants = useActiveFeatureVariants();
  const declined = sar.defendantDeclinedToParticipate;
  const domains = getDomainsForAssessmentType(
    declined ? null : sar.assessmentType,
  );
  const administeredBy = sar.assessmentAdministeredBy;
  const administeredOn = sar.assessmentDate;

  return (
    <View style={style}>
      <UnderlinedHeading
        meta={
          !declined && administeredBy
            ? `Administered By: ${administeredBy}${administeredOn ? `, ${formatLongDate(new Date(administeredOn))}` : ""}`
            : undefined
        }
      >
        {declined
          ? "Offender Risk Assessment"
          : `Offender Risk Assessment (${getAssessmentTypeShortName(sar.assessmentType)})`}
      </UnderlinedHeading>
      {declined && sar.defendantStatement ? (
        <Paragraph>{sar.defendantStatement}</Paragraph>
      ) : null}
      {!shouldShowOrasContent(
        sar.ORASDomainsAvailable,
        activeFeatureVariants,
      ) && sar.noORASDomainReason ? (
        <Paragraph>{sar.noORASDomainReason}</Paragraph>
      ) : null}
      {domains.map((domain, i) => (
        <OrasDomainSection key={i} domain={domain} />
      ))}
    </View>
  );
};
