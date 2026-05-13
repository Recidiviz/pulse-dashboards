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

import { sortResourcesDigitalFirst } from "~@reentry/frontend/utils/resourceSort";
import type { components } from "~@reentry/openapi-types";

import ResourceBankEmptyState from "./ResourceBankEmptyState";
import ResourceBankErrorState from "./ResourceBankErrorState";
import { ResourceBankTilesSkeleton } from "./ResourceBankSkeleton";
import ResourceBankTile from "./ResourceBankTile";
import styles from "./styles/ResourceBank.module.css";

type Resource = components["schemas"]["Resource"];

type ResourceBankProps = {
  section_title: string;
  allResources: { title: string; resources: Resource[] }[];
  clientFirstName: string;
  onRemove: (id: string, name: string, sectionTitle: string) => void;
  isLoadingResources?: boolean;
  isErrorResources?: boolean;
  planGenerationId?: string;
};

const ResourceBank = ({
  section_title,
  allResources,
  clientFirstName,
  onRemove,
  isLoadingResources,
  isErrorResources,
  planGenerationId,
}: ResourceBankProps) => {
  const resources = allResources.find(
    (ra) => ra.title === section_title,
  )?.resources;

  const sortedResources = sortResourcesDigitalFirst(resources ?? []);

  return (
    <div className={styles["section"]}>
      <div className={styles["section_title"]}>
        {section_title} resources
        <span className={styles["printHidden"]}> to explore</span>
      </div>
      <div className={styles["tileList"]}>
        {isLoadingResources && <ResourceBankTilesSkeleton />}
        {!isLoadingResources && isErrorResources && <ResourceBankErrorState />}
        {!isLoadingResources &&
          !isErrorResources &&
          (!resources || resources.length === 0) && <ResourceBankEmptyState />}
        {!isLoadingResources &&
          !isErrorResources &&
          sortedResources.map((resource) => (
            <ResourceBankTile
              key={resource.id}
              resource={resource}
              clientFirstName={clientFirstName}
              onRemove={(id, name) => onRemove(id, name, section_title)}
              planGenerationId={planGenerationId}
            />
          ))}
      </div>
    </div>
  );
};

export default ResourceBank;
