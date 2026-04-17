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

import DropdownSelect from "~@reentry/frontend/components/base/DropdownSelect/DropdownSelect";

import styles from "./styles/FilterForm.module.css";

interface FilterFormProps {
  categoryOptions: Array<{ value: string; label: string; disabled: boolean }>;
  subcategoryOptions: Array<{ value: string; label: string }>;
  radiusOptions: Array<{ value: string; label: string }>;
  selectedCategory: string;
  selectedSubcategory: string;
  selectedRadius: string;
  canSearch: boolean;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onRadiusChange: (value: string) => void;
  onSearch: () => void;
}

const FilterForm = ({
  categoryOptions,
  subcategoryOptions,
  radiusOptions,
  selectedCategory,
  selectedSubcategory,
  selectedRadius,
  canSearch,
  onCategoryChange,
  onSubcategoryChange,
  onRadiusChange,
  onSearch,
}: FilterFormProps) => {
  return (
    <div>
      <div className={styles["filters"]}>
        <DropdownSelect
          label="Category"
          value={selectedCategory}
          options={categoryOptions}
          onChange={onCategoryChange}
          placeholder="Select category"
        />

        <DropdownSelect
          label="Subcategory"
          value={selectedSubcategory}
          options={subcategoryOptions}
          onChange={onSubcategoryChange}
          placeholder="Select subcategory"
          disabled={!selectedCategory}
        />

        <DropdownSelect
          label="Radius"
          value={selectedRadius}
          options={radiusOptions}
          onChange={onRadiusChange}
        />
      </div>

      <button
        className={styles["searchButton"]}
        onClick={onSearch}
        disabled={!canSearch}
      >
        Search
      </button>
    </div>
  );
};

export default FilterForm;
