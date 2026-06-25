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

import { parseISO } from "date-fns";
import React from "react";

import { UsMoClientMetadata } from "~datatypes";

import { CardFrame } from "../shared/styles";
import { OrasAssessmentCard } from "./OrasAssessmentCard";

// Required by Storybook's CSF indexer. Title is auto-derived from the file path.
export default {};

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ maxWidth: 520, width: "100%" }}>
    <CardFrame>{children}</CardFrame>
  </div>
);

const ORAS: UsMoClientMetadata["orasAssessment"] = {
  assessmentScore: 23,
  assessmentType: "ORAS_COMMUNITY_SUPERVISION",
  assessmentAdministeredBy: "MaryAnn Harper",
  assessmentDate: parseISO("2026-04-10"),
};

export const WithLastUpdated = () => (
  <Frame>
    <OrasAssessmentCard
      orasAssessment={ORAS}
      lastUpdated={parseISO("2026-06-01")}
    />
  </Frame>
);

export const WithoutLastUpdated = () => (
  <Frame>
    <OrasAssessmentCard orasAssessment={ORAS} />
  </Frame>
);

export const EmptyState = () => (
  <Frame>
    <OrasAssessmentCard
      orasAssessment={null}
      lastUpdated={parseISO("2026-06-01")}
    />
  </Frame>
);
