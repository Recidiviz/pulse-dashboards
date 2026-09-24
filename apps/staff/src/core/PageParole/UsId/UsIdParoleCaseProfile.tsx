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

import { ParoleCase } from "~datatypes";

import type { ParoleConfig } from "../../models/types";
import { CaseProfileSidebar } from "../components/CaseProfileSidebar";
import { SectionAnchor } from "../components/SectionAnchor";
import { PAROLE_SECTION_IDS } from "../components/shared";
import { UsIdInstitutionalHistorySection } from "../components/US_ID/UsIdInstitutionalHistorySection";
import { UsIdOffenseHistorySection } from "../components/US_ID/UsIdOffenseHistorySection";
import { UsIdParoleSidebar } from "../components/US_ID/UsIdParoleSidebar";
import { ParoleCaseProfileLayout } from "../ParoleCaseProfile/ParoleCaseProfileLayout";

/**
 * Quick-nav entries, in the order the sections render below. Every id here
 * must also appear on a SectionAnchor, or the entry scrolls nowhere.
 */
const SECTION_NAV = [
  { id: PAROLE_SECTION_IDS.offenseHistory, label: "Offense Information" },
  {
    id: PAROLE_SECTION_IDS.institutionalHistory,
    label: "Institutional History",
  },
];

/**
 * Idaho's Parole case profile.
 *
 * @param caseDetail - The case to show.
 * @param config - Idaho's paroleConfig, for its conduct classification colors
 *   and risk assessment tool set.
 */
export function UsIdParoleCaseProfile({
  caseDetail,
  config,
}: {
  caseDetail: ParoleCase;
  config: ParoleConfig;
}) {
  return (
    <ParoleCaseProfileLayout
      sidebar={
        <CaseProfileSidebar caseDetail={caseDetail} sections={SECTION_NAV}>
          <UsIdParoleSidebar caseDetail={caseDetail} config={config} />
        </CaseProfileSidebar>
      }
    >
      <SectionAnchor id={PAROLE_SECTION_IDS.offenseHistory}>
        <UsIdOffenseHistorySection caseDetail={caseDetail} />
      </SectionAnchor>

      <SectionAnchor id={PAROLE_SECTION_IDS.institutionalHistory}>
        <UsIdInstitutionalHistorySection
          caseDetail={caseDetail}
          config={config}
        />
      </SectionAnchor>
    </ParoleCaseProfileLayout>
  );
}
