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

import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import type { components } from "~@reentry/openapi-types";

import LoadingSpinner from "../base/LoadingSpinner";

type ResourcesListProps = {
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

const ResourcesList = ({
  selectedResource,
  candidateResource,
  relatedResources,
  planResources,
  relatedResourcesLoading,
  handleSelectResource,
  clientRecord,
}: ResourcesListProps) => {
  const { track } = useAnalytics();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredResources, setFilteredReources] = useState<
    components["schemas"]["Resource"][]
  >([]);
  useEffect(() => {
    if (selectedResource) {
      setFilteredReources(
        relatedResources?.filter((resource) =>
          resource.name.toLowerCase().includes(searchTerm.toLowerCase()),
        ) || [],
      );
    } else {
      setFilteredReources(
        planResources?.filter((resource) =>
          resource.name.toLowerCase().includes(searchTerm.toLowerCase()),
        ) || [],
      );
    }
  }, [searchTerm, relatedResources, selectedResource, planResources]);

  return (
    <div className="mt-4 w-full overflow-y-auto h-[250px]">
      <div className="text-[#2a5469]/90 text-sm font-medium leading-[16.80px] mb-2">
        {selectedResource
          ? `Resources related to ${selectedResource?.name}`
          : "Current plan resources"}
      </div>
      <input
        type="text"
        placeholder="Type to filter"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-1 border border-gray-300 rounded-md text-sm text-[#2a5469]/90"
      />
      <div className="mt-4 flex flex-col gap-3">
        {/* eslint-disable-next-line no-nested-ternary */}
        {(selectedResource && relatedResourcesLoading) || !planResources ? (
          <LoadingSpinner
            progress={5}
            message="Loading resources"
            startTime={Date.now()}
          />
        ) : filteredResources?.length > 0 ? (
          filteredResources.map((resource, index) => (
            <div
              key={index}
              className={`p-2 border rounded-lg cursor-pointer ${(candidateResource && candidateResource?.name === resource.name && "bg-blue-100 border-blue-300") || (candidateResource === null && selectedResource?.name === resource.name) ? "bg-blue-100 border-blue-300" : "bg-white"}`}
              onClick={() => {
                track("action_plan_resource_selected", {
                  justiceInvolvedPersonId:
                    clientRecord?.pseudonymized_client_id,
                });
                handleSelectResource(resource);
              }}
            >
              <div className="font-semibold text-sm text-[#002321]">
                {resource.name}
              </div>
              <div className="text-[10px] text-[#2a5469]/90">
                {resource.address}
              </div>
              {resource.phone && (
                <div className="text-sm text-gray-600">{resource.phone}</div>
              )}
              {resource.rating && (
                <div className="text-[10px] text-[#2a5469]/90">
                  {resource.rating} stars on Google Maps ({resource.ratingCount}{" "}
                  reviews)
                </div>
              )}
              {resource.transport_minutes && (
                <div className="text-[10px] text-[#2a5469]/90">
                  {resource.transport_minutes}min by {resource.transport_mode}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-sm text-[#2a5469]/90 text-center">Not found</div>
        )}
      </div>
    </div>
  );
};

export default ResourcesList;
