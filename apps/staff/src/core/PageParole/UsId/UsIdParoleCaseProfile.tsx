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
import { rem } from "polished";
import { ReactNode } from "react";
import styled from "styled-components";

import { ParoleCase } from "~datatypes";
import { palette, typography } from "~design-system";
import {
  Hydratable,
  hydrationFailure,
  withPresenterManager,
} from "~hydration-utils";

import { useRootStore } from "../../../components/StoreProvider";
import { ParoleBoardReportPresenter } from "../../../ParoleStore/presenters/ParoleBoardReportPresenter";
import { resolveCommunityReentryPlan } from "../../../ParoleStore/report/communityReentryPlan";
import { resolvePersonalHistory } from "../../../ParoleStore/report/personalHistory";
import { resolveSummary } from "../../../ParoleStore/report/summary";
import ModelHydrator from "../../ModelHydrator";
import type { ParoleConfig } from "../../models/types";
import {
  CaseProfileSidebar,
  ParoleSectionNavItem,
} from "../components/CaseProfileSidebar";
import { SectionAnchor } from "../components/SectionAnchor";
import { PAROLE_SECTION_IDS } from "../components/shared";
import { UsIdCommunityReentryPlanSection } from "../components/US_ID/UsIdCommunityReentryPlanSection";
import { UsIdHearingHistorySection } from "../components/US_ID/UsIdHearingHistorySection";
import { UsIdInstitutionalHistorySection } from "../components/US_ID/UsIdInstitutionalHistorySection";
import { UsIdOffenseHistorySection } from "../components/US_ID/UsIdOffenseHistorySection";
import { UsIdParoleSidebar } from "../components/US_ID/UsIdParoleSidebar";
import { UsIdPersonalHistorySection } from "../components/US_ID/UsIdPersonalHistorySection";
import { UsIdSummarySection } from "../components/US_ID/UsIdSummarySection";
import { ParoleCaseProfileLayout } from "../ParoleCaseProfile/ParoleCaseProfileLayout";

/**
 * Quick-nav entries, in the order the sections render below. Every id here
 * must also appear on a SectionAnchor, or the entry scrolls nowhere. Entries
 * marked reportOnly are the PHI report's sections, which show only while the
 * profile shows the report.
 */
const SECTION_NAV: ReadonlyArray<ParoleSectionNavItem & { reportOnly?: true }> =
  [
    { id: PAROLE_SECTION_IDS.offenseHistory, label: "Offense Information" },
    {
      id: PAROLE_SECTION_IDS.institutionalHistory,
      label: "Institutional History",
    },
    {
      id: PAROLE_SECTION_IDS.personalHistory,
      label: "Personal History",
      reportOnly: true,
    },
    {
      id: PAROLE_SECTION_IDS.hearingHistory,
      label: "Hearing History",
    },
    {
      id: PAROLE_SECTION_IDS.communityReentryPlan,
      label: "Community Reentry Plan",
      reportOnly: true,
    },
    { id: PAROLE_SECTION_IDS.summary, label: "Summary", reportOnly: true },
  ];

type UsIdParoleCaseProfileProps = {
  caseDetail: ParoleCase;
  config: ParoleConfig;
};

const ReportLoadFailedBanner = styled.div.attrs({ role: "alert" })`
  ${typography.Sans14}
  color: ${palette.pine1};
  background: ${palette.marble1};
  border-left: ${rem(4)} solid ${palette.signal.error};
  padding: ${rem(16)};
`;

const UsIdParoleCaseProfileContents = observer(
  function UsIdParoleCaseProfileContents({
    caseDetail,
    config,
    presenter,
  }: UsIdParoleCaseProfileProps & { presenter: ParoleBoardReportPresenter }) {
    const { mode } = presenter;
    const sections = SECTION_NAV.filter((entry) => mode || !entry.reportOnly);

    return (
      <ParoleCaseProfileLayout
        sidebar={
          <CaseProfileSidebar caseDetail={caseDetail} sections={sections}>
            <UsIdParoleSidebar caseDetail={caseDetail} config={config} />
          </CaseProfileSidebar>
        }
        beforeReport={
          presenter.reportFailedToLoad && (
            <ReportLoadFailedBanner>
              We couldn’t load the PHI report, so this page shows the current
              Atlas data and editing is off. Reload the page to try again.
            </ReportLoadFailedBanner>
          )
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

        {mode && (
          <SectionAnchor id={PAROLE_SECTION_IDS.personalHistory}>
            <UsIdPersonalHistorySection
              mode={mode}
              history={resolvePersonalHistory(
                presenter.report?.sections.personalHistory,
              )}
              onSave={(field, value) =>
                presenter.setFieldValue("personalHistory", field, value)
              }
            />
          </SectionAnchor>
        )}

        <SectionAnchor id={PAROLE_SECTION_IDS.hearingHistory}>
          <UsIdHearingHistorySection
            hearingHistory={caseDetail.hearingHistory ?? []}
          />
        </SectionAnchor>

        {mode && (
          <SectionAnchor id={PAROLE_SECTION_IDS.communityReentryPlan}>
            <UsIdCommunityReentryPlanSection
              mode={mode}
              plan={resolveCommunityReentryPlan(
                presenter.report?.sections.communityReentryPlan,
              )}
              onSave={(field, value) =>
                presenter.setFieldValue("communityReentryPlan", field, value)
              }
            />
          </SectionAnchor>
        )}

        {mode && (
          <SectionAnchor id={PAROLE_SECTION_IDS.summary}>
            <UsIdSummarySection
              mode={mode}
              summary={resolveSummary(presenter.report?.sections.summary)}
              onSaveSummary={(value) =>
                presenter.setFieldValue("summary", "summary", value)
              }
              onSaveWaiver={(value) =>
                presenter.setFieldValue(
                  "summary",
                  "fourthAmendmentWaiver",
                  value,
                )
              }
            />
          </SectionAnchor>
        )}
      </ParoleCaseProfileLayout>
    );
  },
);

function usePresenter({ caseDetail }: UsIdParoleCaseProfileProps) {
  const { firestoreStore, userStore } = useRootStore();
  return new ParoleBoardReportPresenter(firestoreStore, userStore, caseDetail);
}

/**
 * Shows a spinner while the PHI report loads, then the profile. A report that
 * fails to load still leaves the profile showing, read-only, rather than the
 * page's error.
 */
const ReportHydrator = observer(function ReportHydrator({
  hydratable,
  children,
}: {
  hydratable: Hydratable;
  children: ReactNode;
}) {
  if (hydrationFailure(hydratable)) return <>{children}</>;
  return <ModelHydrator hydratable={hydratable}>{children}</ModelHydrator>;
});

/**
 * Idaho's Parole case profile. For a PHI with usIdParoleBoardReports on, it
 * loads the resident's PHI report before rendering, and its sections take
 * their mode and data from ParoleBoardReportPresenter. If the report fails to
 * load, the profile shows today's read-only sections under a banner.
 *
 * @param caseDetail - The case to show.
 * @param config - Idaho's paroleConfig, for its conduct classification colors
 *   and risk assessment tool set.
 */
export const UsIdParoleCaseProfile = withPresenterManager({
  usePresenter,
  ManagedComponent: UsIdParoleCaseProfileContents,
  managerIsObserver: false,
  HydratorComponent: ReportHydrator,
});
