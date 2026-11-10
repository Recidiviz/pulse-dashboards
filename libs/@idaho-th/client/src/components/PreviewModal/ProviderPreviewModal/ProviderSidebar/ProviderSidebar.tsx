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

import {
  findAlert,
  getSubStageLabel,
} from "~@idaho-th/client/utils/applications";
import { AlertType, DEFAULT_NEW_HOUSING_APPLICATION } from "~@idaho-th/shared";

import { useHousingApplicationsStore } from "../../../../datastores/IdahoTHStoreContext";
import {
  useDismissProviderAlert,
  useProviderApplicationById,
} from "../../../../hooks/useApplicationDetail";
import { PROVIDER_TABS, TabDef } from "../../constants";
import * as Styled from "../../PreviewModal.styles";
import {
  SidebarAlerts,
  SidebarReleaseDateRow,
  SidebarStageSection,
  SidebarTabNav,
  SidebarUserHeader,
  SidebarWarningBanner,
} from "../../Sidebar/common";

interface ProviderSidebarProps {
  showRequirementWarning?: boolean;
  requirementConflictFactors?: string[];
  tabs?: TabDef[];
  detailLoaded?: boolean;
}

export const ProviderSidebar: React.FC<ProviderSidebarProps> = observer(
  function ProviderSidebar({
    showRequirementWarning = false,
    requirementConflictFactors = [],
    tabs = PROVIDER_TABS,
    detailLoaded = false,
  }) {
    const { currentApplicationId } = useHousingApplicationsStore();
    const { data: currentApplication } = useProviderApplicationById(
      currentApplicationId,
      detailLoaded && !!currentApplicationId,
    );

    const { mutate: dismissAlert } =
      useDismissProviderAlert(currentApplicationId);
    const onDismissAlert = (alertId: string) => dismissAlert({ alertId });

    // The release-date alert renders inside its own row, above every other
    // notification banner.
    const alerts = currentApplication?.alerts ?? [];
    const releaseDateAlert = findAlert(alerts, AlertType.RELEASE_DATE_CHANGED);
    const bannerAlerts = alerts.filter(
      (alert) => alert.type !== AlertType.RELEASE_DATE_CHANGED,
    );

    const stage =
      currentApplication?.stage ?? DEFAULT_NEW_HOUSING_APPLICATION.stage;

    const substageOverride = getSubStageLabel(
      {
        stage,
        subStage: currentApplication?.subStage,
        releaseTaskProgress: currentApplication?.releaseTaskProgress,
      },
      "detailed",
    );

    return (
      <Styled.Sidebar>
        <SidebarUserHeader clientName={currentApplication?.clientName} />
        <Styled.SidebarBodySection>
          <Styled.SidebarTopContainer>
            <SidebarReleaseDateRow
              expectedReleaseDate={
                currentApplication?.expectedReleaseDate ?? null
              }
              alert={releaseDateAlert}
              onDismissAlert={onDismissAlert}
            />
            <SidebarAlerts alerts={bannerAlerts} onDismiss={onDismissAlert} />
            {showRequirementWarning && (
              <SidebarWarningBanner
                conflictFactors={requirementConflictFactors}
              />
            )}
          </Styled.SidebarTopContainer>
          <Styled.SidebarDivider />
          <SidebarStageSection
            substageText={substageOverride}
            stage={currentApplication?.stage}
            subStage={currentApplication?.subStage ?? undefined}
          />
          <Styled.SidebarDivider />
          <SidebarTabNav tabs={tabs} detailLoaded={detailLoaded} />
        </Styled.SidebarBodySection>
      </Styled.Sidebar>
    );
  },
);
