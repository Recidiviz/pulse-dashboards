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

import type { ResourceWithMeta } from "~@reentry/frontend/hooks/resourceBank.types";

import ResourceBankEmptyState from "./ResourceBankEmptyState";
import ResourceBankErrorState from "./ResourceBankErrorState";
import { ResourceBankTilesSkeleton } from "./ResourceBankSkeleton";
import ResourceBankTile from "./ResourceBankTile";
import styles from "./styles/ResourceBank.module.css";

type ResourceBankProps = {
  section: string;
  allResources: { title: string; resources: ResourceWithMeta[] }[];
  clientFirstName: string;
  onRemove: (id: string, name: string, sectionTitle: string) => void;
  isLoadingResources?: boolean;
  isErrorResources?: boolean;
};

const ResourceBank = ({
  section,
  allResources,
  clientFirstName,
  onRemove,
  isLoadingResources,
  isErrorResources,
}: ResourceBankProps) => {
  const resources = allResources.find((ra) => ra.title === section)?.resources;
  return (
    <div className={styles["section"]}>
      <div className={styles["sectionTitle"]}>
        {section} resources
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
          resources?.map((resource) => (
            <ResourceBankTile
              key={resource.id}
              resource={resource}
              clientFirstName={clientFirstName}
              onRemove={(id, name) => onRemove(id, name, section)}
            />
          ))}
      </div>
    </div>
  );
};

export default ResourceBank;
