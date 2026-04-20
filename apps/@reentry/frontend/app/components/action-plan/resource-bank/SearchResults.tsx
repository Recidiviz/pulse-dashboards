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

"use client";

import type { ResourceWithMeta } from "~@reentry/frontend/hooks/resourceBank.types";

import { SectionTitle } from "../types";
import AddToSectionButton from "./AddToSectionButton";
import styles from "./styles/SearchResults.module.css";

interface SearchResultsProps {
  addResource: (sectionTitle: string, resource: ResourceWithMeta) => void;
  sectionTitles: SectionTitle[];
  results: ResourceWithMeta[];
}

const SearchResults = ({
  addResource,
  results,
  sectionTitles,
}: SearchResultsProps) => {
  if (results.length === 0) {
    return (
      <p className={styles["noResults"]}>
        No resources found. Try adjusting your filters.
      </p>
    );
  }

  return (
    <div className={styles["results"]}>
      {results.map((resource) => (
        <div key={resource.id} className={styles["card"]}>
          <div className={styles["cardHeader"]}>
            <span className={styles["cardName"]}>{resource.name}</span>
            <AddToSectionButton
              addResource={addResource}
              resource={resource}
              sectionTitles={sectionTitles}
            />
          </div>
          <div className={styles["cardMeta"]}>
            <span className={styles["categoryBadge"]}>
              {resource.subcategory}
            </span>
            {resource.travel_distance_miles !== undefined && (
              <span className={styles["distance"]}>
                {resource.travel_distance_miles.toFixed(1)} mi
              </span>
            )}
          </div>
          {resource.description && (
            <p className={styles["cardDescription"]}>{resource.description}</p>
          )}
          {resource.address && (
            <p className={styles["cardAddress"]}>{resource.address}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
