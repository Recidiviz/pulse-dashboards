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
import { useParams } from "react-router-dom";

import { withPresenterManager } from "~hydration-utils";

import NotFound from "../../../components/NotFound";
import { useRootStore } from "../../../components/StoreProvider";
import { ParoleCaseProfilePresenter } from "../../../ParoleStore/presenters/ParoleCaseProfilePresenter";
import { TenantId } from "../../../RootStore/types";
import ModelHydrator from "../../ModelHydrator";
import { CaseProfileSidebar } from "../components/CaseProfileSidebar";
import { DefaultParoleGeneralInfo } from "../components/ParoleGeneralInfo";
import {
  NON_NAV_PAROLE_SECTIONS,
  PAROLE_SECTION_LABELS,
  ParoleSectionComponents,
} from "../components/ParoleSectionComponents";
import { ReportHeader } from "../components/ReportHeader";
import { SectionAnchor } from "../components/SectionAnchor";
import { PAROLE_SECTION_IDS } from "../components/shared";
import { ParoleCaseProfileLayout } from "./ParoleCaseProfileLayout";

const ParoleCaseProfileContents = observer(function ParoleCaseProfileContents({
  presenter,
}: {
  presenter: ParoleCaseProfilePresenter;
}) {
  // ModelHydrator only renders this component once hydration has succeeded,
  // so `presenter.caseDetail` is safe to access here -- but NOT at the call
  // site below, where it would be evaluated eagerly on every render pass.
  const { caseDetail, config } = presenter;
  const hasDownloadReport = config.sections.includes("downloadReport");
  const contentSections = config.sections.filter(
    (sectionName) => sectionName !== "downloadReport",
  );
  const sectionLabels = {
    ...PAROLE_SECTION_LABELS,
    offenseHistory:
      config.offenseHistoryTitle ?? PAROLE_SECTION_LABELS.offenseHistory,
    conductHistory:
      config.conductHistory.title ?? PAROLE_SECTION_LABELS.conductHistory,
  };
  const navSections = config.sections
    .filter((sectionName) => !NON_NAV_PAROLE_SECTIONS.has(sectionName))
    .map((sectionName) => ({
      id: PAROLE_SECTION_IDS[sectionName],
      label: sectionLabels[sectionName],
    }));
  const SidebarBody = config.sidebarComponent ?? DefaultParoleGeneralInfo;

  return (
    <ParoleCaseProfileLayout
      sidebar={
        <CaseProfileSidebar caseDetail={caseDetail} sections={navSections}>
          <SidebarBody caseDetail={caseDetail} config={config} />
        </CaseProfileSidebar>
      }
      beforeReport={
        hasDownloadReport && ParoleSectionComponents.downloadReport(caseDetail)
      }
    >
      {hasDownloadReport && (
        <ReportHeader name={caseDetail.name} displayId={caseDetail.displayId} />
      )}
      {contentSections.map((sectionName) => (
        <SectionAnchor key={sectionName} id={PAROLE_SECTION_IDS[sectionName]}>
          {ParoleSectionComponents[sectionName](caseDetail, config)}
        </SectionAnchor>
      ))}
    </ParoleCaseProfileLayout>
  );
});

function usePresenter({
  docId,
}: {
  docId: string;
  currentTenantId: TenantId | undefined;
}) {
  const { paroleStore } = useRootStore();
  return new ParoleCaseProfilePresenter(paroleStore, docId);
}

const ParoleCaseProfileHydrator = withPresenterManager({
  usePresenter,
  ManagedComponent: ParoleCaseProfileContents,
  managerIsObserver: false,
  HydratorComponent: ModelHydrator,
});

export function ParoleCaseProfile() {
  const { docId } = useParams<{ docId: string }>();
  const { currentTenantId } = useRootStore();

  if (!docId) return <NotFound />;

  return (
    <ParoleCaseProfileHydrator
      docId={docId}
      currentTenantId={currentTenantId}
    />
  );
}
