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

  // Display "DIGITAL" resources before "COMMUNITY"
  // When non-partner digital resources are included in the table, update this logic
  // to prioritize partners. https://linear.app/recidiviz/issue/OBT-18107/update-display-logic-to-differentiate-partners-in-fe
  const RESOURCE_TYPE_ORDER: Record<
    components["schemas"]["ResourceAssociationType"],
    number
  > = { DIGITAL: 0, COMMUNITY: 1 };
  const sortedResources = [...(resources ?? [])].sort(
    (r1, r2) =>
      RESOURCE_TYPE_ORDER[r1.resource_type] -
      RESOURCE_TYPE_ORDER[r2.resource_type],
  );

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
