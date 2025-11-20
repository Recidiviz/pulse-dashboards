// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { useEffect, useState } from "react";

import HomeAddressSection from "~@reentry/frontend/components/action-plan/HomeAddressSection";
import ProfileDetail from "~@reentry/frontend/components/action-plan/ProfileDetail";
import RegeneratePlan from "~@reentry/frontend/components/action-plan/RegeneratePlan";
import Resources from "~@reentry/frontend/components/action-plan/Resources";
import { isFeatureEnabled } from "~@reentry/frontend/utils/featureFlagsRuntime";
import type { components } from "~@reentry/openapi-types";

interface SidePanelProps {
  clientRecord: components["schemas"]["ClientRecordResponse"] | null;
  planId: string;
  startPolling: (executionId: string) => void;
  setOpenResourceSection: (value: boolean) => void;
  initialResourceSelected?: components["schemas"]["Resource"] | null;
  setRegenerationMessage: (value: string) => void;
  handleOpenResourceSection: () => void;
  openResourceSection: boolean;
  selectedResource: components["schemas"]["Resource"] | null | undefined;
  candidateResource: components["schemas"]["Resource"] | null | undefined;
  relatedResources: components["schemas"]["Resource"][] | null | undefined;
  planResources?: components["schemas"]["Resource"][] | null | undefined;
  relatedResourcesLoading: boolean;
  handleSelectResource: (r: components["schemas"]["Resource"]) => void;
  dataDetailPlan: components["schemas"]["PlanResponseGet"];
  isPolling?: boolean;
}

const SidePanel = ({
  clientRecord,
  planId,
  startPolling,
  selectedResource,
  candidateResource,
  setRegenerationMessage,
  relatedResourcesLoading,
  planResources,
  handleSelectResource,
  relatedResources,
  handleOpenResourceSection,
  openResourceSection,
  dataDetailPlan,
  isPolling = false,
}: SidePanelProps) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsExpanded(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="w-full md:w-[25%] overflow-auto md:h-full self-stretch bg-white border-r border-[#2b5469]/20 flex-col justify-start items-center gap-2 inline-flex print:hidden">
      <div className="self-stretch h-full flex-col justify-start items-start flex">
        <ProfileDetail
          clientRecord={clientRecord}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
        />

        {isExpanded && (
          <>
            {/*<PlanStatus />*/}
            <Resources
              selectedResource={selectedResource}
              candidateResource={candidateResource}
              relatedResourcesLoading={relatedResourcesLoading}
              planResources={planResources}
              handleSelectResource={handleSelectResource}
              relatedResources={relatedResources}
              handleOpenResourceSection={handleOpenResourceSection}
              openResourceSection={openResourceSection}
              clientRecord={clientRecord}
            />
            {isFeatureEnabled("REGENERATE_WITH_PROMPT") && (
              <RegeneratePlan
                planId={planId}
                startPolling={startPolling}
                setRegenerationMessage={setRegenerationMessage}
                dataDetailPlan={dataDetailPlan}
                isPolling={isPolling}
                clientRecord={clientRecord}
              />
            )}
            <HomeAddressSection
              clientRecord={clientRecord}
              planId={planId}
              startPolling={startPolling}
              isPolling={isPolling}
            />
          </>
        )}
      </div>
    </div>
  );
};
export default SidePanel;
