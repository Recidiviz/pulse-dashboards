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

import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";

import { UsMoClientMetadata } from "~datatypes";

import { Client } from "../../../../WorkflowsStore";
import { ModuleHeader, ModuleHeading } from "../shared/styles";
import { CasePlanList } from "./CasePlanList";
import { CasePlanPagination } from "./CasePlanPagination";
import { paginateCasePlanGoals } from "./caseplanUtils";
import { OrasAssessmentCard } from "./OrasAssessmentCard";

type UsMoCasePlanningViewProps = {
  orasAssessment: UsMoClientMetadata["orasAssessment"];
  casePlan: UsMoClientMetadata["casePlan"];
  lastUpdated?: Date | null;
  now?: Date;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

/**
 * Presentational "Case Planning" module for the US_MO supervision profile:
 * a section heading, the ORAS assessment card, the case-plan goal list, and
 * a pagination control. `casePlan` here is already the current page's slice;
 * `currentPage`/`totalPages`/`onPageChange` drive the `CasePlanPagination`
 * control below it.
 *
 * Pure / data-in; the `observer` wrapper below reads off the `Client` instance.
 */
export const UsMoCasePlanningView: React.FC<UsMoCasePlanningViewProps> = ({
  orasAssessment,
  casePlan,
  lastUpdated,
  now,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div>
      <ModuleHeader>
        <ModuleHeading>Case Planning</ModuleHeading>
      </ModuleHeader>
      <OrasAssessmentCard
        orasAssessment={orasAssessment}
        lastUpdated={lastUpdated}
      />
      <CasePlanList casePlan={casePlan} now={now} />
      <CasePlanPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};

type UsMoCasePlanningProps = {
  client: Client;
};

/**
 * "Case Planning" section for the US_MO supervision profile. Reads ORAS +
 * case-plan data directly off the hydrated `Client` MobX instance, and reads/
 * writes the current case-plan page via `client.casePlanPage`, which persists
 * for the session because `Client` instances are cached per-person. The parent
 * `FullProfile` gates rendering on `instanceof Client && stateCode === "US_MO"`,
 * so the metadata is known to be the US_MO variant by the time this mounts —
 * hence the cast.
 *
 * `lastUpdated` is the date the ORAS data was last synced from the agency that
 * provides it (a distinct backend field from the assessment date); it is
 * nullish, so the header omits "Last Updated" when it's absent.
 */
export const UsMoCasePlanning = observer(function UsMoCasePlanning({
  client,
}: UsMoCasePlanningProps): React.ReactElement {
  const { orasAssessment, casePlan } = client.metadata as UsMoClientMetadata;
  const { goals, currentPage, totalPages } = paginateCasePlanGoals(
    casePlan ?? [],
    client.casePlanPage,
  );

  // If the stored page was out of range (e.g. the case plan shrank since it
  // was set) and got clamped for display, persist the clamped value back so
  // a later increase in goal count doesn't snap the view back to the stale,
  // now-out-of-range page.
  useEffect(() => {
    if (currentPage !== client.casePlanPage) {
      client.setCasePlanPage(currentPage);
    }
  }, [client, currentPage]);

  return (
    <UsMoCasePlanningView
      orasAssessment={orasAssessment}
      casePlan={goals}
      lastUpdated={orasAssessment?.lastUpdated ?? undefined}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={(page) => client.setCasePlanPage(page)}
    />
  );
});
