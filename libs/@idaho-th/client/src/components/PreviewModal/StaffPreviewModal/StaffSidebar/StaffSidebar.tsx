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
import { useState } from "react";

import { getSubStageLabel } from "~@idaho-th/client/utils/applications";
import {
  APPLICATION_STAGE,
  DEFAULT_NEW_HOUSING_APPLICATION,
} from "~@idaho-th/shared";

import { useHousingApplicationsStore } from "../../../../datastores/IdahoTHStoreContext";
import {
  useDismissStaffAlert,
  useStaffApplicationById,
} from "../../../../hooks/useApplicationDetail";
import { STAFF_TABS, TabDef } from "../../constants";
import * as Styled from "../../PreviewModal.styles";
import {
  SidebarAlerts,
  SidebarReleaseDateRow,
  SidebarStageSection,
  SidebarTabNav,
  SidebarUserHeader,
} from "../../Sidebar/common";
import { UpdateReleaseDateModal } from "../../UpdateReleaseDateModal";
import { getVisibleStaffTabs } from "../utils/getVisibleStaffTabs";

interface StaffSidebarProps {
  tabs?: TabDef[];
  detailLoaded?: boolean;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = observer(
  function StaffSidebar({ tabs = STAFF_TABS, detailLoaded = false }) {
    const { currentApplicationId } = useHousingApplicationsStore();
    const { data: currentApplication } = useStaffApplicationById(
      currentApplicationId,
      detailLoaded && !!currentApplicationId,
    );
    const { mutate: dismissAlert } = useDismissStaffAlert(currentApplicationId);
    const [isReleaseDateModalOpen, setIsReleaseDateModalOpen] = useState(false);

    const stage =
      currentApplication?.stage ?? DEFAULT_NEW_HOUSING_APPLICATION.stage;
    const isClosed = stage === APPLICATION_STAGE.CLOSED;

    const substageOverride = getSubStageLabel(
      {
        stage,
        subStage: currentApplication?.subStage,
        releaseTaskProgress: currentApplication?.releaseTaskProgress,
      },
      "detailed",
    );

    return (
      <>
        <Styled.Sidebar>
          <SidebarUserHeader clientName={currentApplication?.clientName} />
          <Styled.SidebarBodySection>
            <Styled.SidebarTopContainer>
              <SidebarAlerts
                alerts={currentApplication?.alerts ?? []}
                onDismiss={(alertId) => dismissAlert({ alertId })}
              />
              <SidebarReleaseDateRow
                onEditClick={
                  // Release date is read-only on closed applications
                  isClosed ? undefined : () => setIsReleaseDateModalOpen(true)
                }
                expectedReleaseDate={
                  currentApplication?.expectedReleaseDate ?? null
                }
              />
            </Styled.SidebarTopContainer>
            <Styled.SidebarDivider />
            <SidebarStageSection
              substageText={substageOverride}
              stage={currentApplication?.stage}
              subStage={currentApplication?.subStage ?? undefined}
            />
            <Styled.SidebarDivider />
            <SidebarTabNav
              tabs={getVisibleStaffTabs(tabs, currentApplication)}
              detailLoaded={detailLoaded}
            />
          </Styled.SidebarBodySection>
        </Styled.Sidebar>

        {!isClosed && (
          <UpdateReleaseDateModal
            isOpen={isReleaseDateModalOpen}
            onClose={() => setIsReleaseDateModalOpen(false)}
            applicationId={currentApplicationId}
            currentDate={currentApplication?.expectedReleaseDate ?? null}
          />
        )}
      </>
    );
  },
);
