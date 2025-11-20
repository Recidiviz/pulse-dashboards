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

import Image from "next/image";

import { InfoTooltip } from "~@reentry/frontend/components/base/InfoTooltip";
import type { components } from "~@reentry/openapi-types";

import ResourcesList from "./ResourcesList";

export type ResourcesProps = {
  handleOpenResourceSection: () => void;
  openResourceSection: boolean;
  selectedResource: components["schemas"]["Resource"] | null | undefined;
  candidateResource: components["schemas"]["Resource"] | null | undefined;
  relatedResources: components["schemas"]["Resource"][] | null | undefined;
  planResources?: components["schemas"]["Resource"][] | null | undefined;
  relatedResourcesLoading: boolean;
  handleSelectResource: (r: components["schemas"]["Resource"]) => void;
  clientRecord:
    | components["schemas"]["ClientRecordResponse"]
    | null
    | undefined;
};

export enum ShowResourcesEnum {
  planResources = 0,
  relatedResources = 1,
}
const Resources = ({
  handleOpenResourceSection,
  openResourceSection,
  selectedResource,
  candidateResource,
  relatedResourcesLoading,
  planResources,
  handleSelectResource,
  relatedResources,
  clientRecord,
}: ResourcesProps) => {
  return (
    <div className="self-stretch h-auto max-h-[320px] px-2 md:px-8 py-6 border-b border-[#2b5469]/20 flex-col justify-start items-start gap-3 flex ">
      <div className="justify-start items-center gap-2 inline-flex w-full">
        <div className="text-[#002321] text-sm font-medium leading-[16.80px]">
          Resources
        </div>
        <InfoTooltip
          text="Select a underlined resource in the action plan to review and swap in alternative options."
          position="top"
        />
        <div className={"flex w-full items-end justify-end"}>
          <Image
            src={"/images/arrow_down.svg"}
            alt="toggle arrow"
            width={10}
            height={10}
            priority
            onClick={handleOpenResourceSection}
            className={`cursor-pointer transition-transform duration-200 ${!openResourceSection ? "-rotate-90" : ""}`}
          />
        </div>
      </div>
      {openResourceSection && (
        <ResourcesList
          selectedResource={selectedResource}
          candidateResource={candidateResource}
          relatedResourcesLoading={relatedResourcesLoading}
          planResources={planResources}
          handleSelectResource={handleSelectResource}
          relatedResources={relatedResources}
          clientRecord={clientRecord}
        />
      )}
    </div>
  );
};
export default Resources;
