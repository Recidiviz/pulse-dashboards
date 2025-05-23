// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { renderHook } from "@testing-library/react";

import useSort from "../useSort";

describe("useSort", () => {
  const sortableData = [
    {
      state_id: "123",
      district: "01",
      officer: "Callie Torres",
      risk_level: "HIGH",
      officer_recommendation: "TREATMENT_IN_FIELD",
      violation_record: "1subs",
      admission_history_description: "LEGAL_REVOCATION",
    },
    {
      state_id: "456",
      district: "01",
      officer: "Arizona Robbins",
      risk_level: "LOW",
      officer_recommendation: "PLACEMENT_IN_DOC_FACILITY",
      violation_record: "2law;1high_tech",
      admission_history_description:
        "LEGAL_REVOCATION;SHOCK_INCARCERATION_12_MONTHS",
    },
    {
      state_id: "789",
      district: "01",
      officer: "Derek Shepherd",
      risk_level: "MEDIUM",
      officer_recommendation: "PLACEMENT_IN_DOC_FACILITY",
      violation_record: "2law;1high_tech",
      admission_history_description:
        "SHOCK_INCARCERATION_PVC;SHOCK_INCARCERATION_0_TO_6_MONTHS",
    },
    {
      state_id: "321",
      district: "01",
      officer: "Christina Yang",
      risk_level: "LOW",
      officer_recommendation: "PLACEMENT_IN_DOC_FACILITY",
      violation_record: "2law",
      admission_history_description:
        "SHOCK_INCARCERATION_0_TO_6_MONTHS;SHOCK_INCARCERATION_PVC",
    },
    {
      state_id: "654",
      district: "01",
      officer: "April Kepner",
      risk_level: "MEDIUM",
      officer_recommendation: "PLACEMENT_IN_DOC_FACILITY",
      violation_record: "2high_tech;1subs;1med_tech",
      admission_history_description:
        "LEGAL_REVOCATION;SHOCK_INCARCERATION_0_TO_6_MONTHS;SHOCK_INCARCERATION_PVC",
    },
  ];

  describe("admission_history_description", () => {
    it("sorts by number of admissions and then alphabetically", () => {
      const { comparator } = renderHook(() => useSort());
      const sortedData = sortableData.sort(comparator);
      expect(sortedData.map((d) => d.admission_history_description)).toEqual([
        "LEGAL_REVOCATION",
        "LEGAL_REVOCATION;SHOCK_INCARCERATION_12_MONTHS",
        "SHOCK_INCARCERATION_PVC;SHOCK_INCARCERATION_0_TO_6_MONTHS",
        "SHOCK_INCARCERATION_0_TO_6_MONTHS;SHOCK_INCARCERATION_PVC",
        "LEGAL_REVOCATION;SHOCK_INCARCERATION_0_TO_6_MONTHS;SHOCK_INCARCERATION_PVC",
      ]);
    });
  });
});
