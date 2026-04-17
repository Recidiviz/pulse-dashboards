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

import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";
import { MdExpandLess, MdExpandMore, MdInfoOutline } from "react-icons/md";

import useResourceSearch from "~@reentry/frontend/hooks/useResourceSearch";

import type { SectionTitle } from "../types";
import { RADIUS_OPTIONS } from "./categorySubcategoryMap";
import FilterForm from "./FilterForm";
import SearchResults from "./SearchResults";
import styles from "./styles/ResourceSearchPanel.module.css";

export interface ResourceSearchPanelProps {
  sectionTitles: SectionTitle[];
  categorySubcategoryMap: Record<string, string[]>;
}

const ResourceSearchPanel = ({
  sectionTitles,
  categorySubcategoryMap,
}: ResourceSearchPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedRadius, setSelectedRadius] = useState(50);

  const { isLoading, results, search } = useResourceSearch();

  const categoryOptions = Object.keys(categorySubcategoryMap)
    .filter((cat) =>
      sectionTitles.some((s) =>
        s.title.toLowerCase().startsWith(cat.toLowerCase()),
      ),
    )
    .map((cat) => ({ value: cat, label: cat, disabled: false }));

  const subcategoryOptions = selectedCategory
    ? (categorySubcategoryMap[selectedCategory] ?? []).map((sub) => ({
        value: sub,
        label: sub,
      }))
    : [];

  const radiusOptions = RADIUS_OPTIONS.map((r) => ({
    value: String(r),
    label: `${r} mi`,
  }));

  const handleSearch = () => {
    if (!selectedCategory) return;
    search(selectedCategory, selectedSubcategory, selectedRadius);
  };

  return (
    <div className={styles["container"]}>
      <div className={styles["header"]}>
        <div className={styles["headerLeft"]}>
          <span className={styles["headerTitle"]}>Resources</span>
          <Tooltip
            title="Search for community resources to add to the client's action plan."
            placement="top"
            arrow
          >
            <span className={styles["infoIcon"]} aria-label="Resources info">
              <MdInfoOutline size={14} />
            </span>
          </Tooltip>
        </div>
        <button
          className={styles["collapseButton"]}
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-label={isExpanded ? "Collapse resources" : "Expand resources"}
        >
          {isExpanded ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className={styles["body"]}>
          <FilterForm
            categoryOptions={categoryOptions}
            subcategoryOptions={subcategoryOptions}
            radiusOptions={radiusOptions}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            selectedRadius={String(selectedRadius)}
            canSearch={Boolean(selectedCategory) && !isLoading}
            onCategoryChange={(value) => {
              setSelectedCategory(value);
              setSelectedSubcategory("");
            }}
            onSubcategoryChange={(value) => {
              setSelectedSubcategory(value);
            }}
            onRadiusChange={(value) => {
              setSelectedRadius(Number(value));
            }}
            onSearch={handleSearch}
          />

          {results !== null && <SearchResults results={results} />}
        </div>
      )}
    </div>
  );
};

export default ResourceSearchPanel;
