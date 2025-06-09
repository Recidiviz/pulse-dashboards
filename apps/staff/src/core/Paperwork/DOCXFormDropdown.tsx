// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { rem, transparentize } from "polished";
import { useEffect, useState } from "react";
import Select from "react-select";

import { palette } from "~design-system";

import { useOpportunityFormContext } from "./OpportunityFormContext";

export interface DOCXFormDropdownProps<DraftData> {
  name: Extract<keyof DraftData, string>;
  menuItems: string[];
}

export const DOCXFormDropdown = observer(function FormInput<DraftData>({
  name,
  menuItems,
}: DOCXFormDropdownProps<DraftData>) {
  const opportunityForm = useOpportunityFormContext();
  const formValue = opportunityForm.formData[name];

  const menuItemsWithDefault = ["", ...menuItems];

  const [dropdownButtonText, setDropdownButtonTextValue] = useState(
    menuItems[formValue] || "",
  );

  useEffect(() => {
    if (formValue) {
      setDropdownButtonTextValue(formValue);
    }
  }, [formValue]);

  return (
    <div
      style={{
        minWidth: "55%",
      }}
    >
      <Select
        isSearchable={false}
        options={menuItemsWithDefault.map((e) => {
          return { label: e ? e : "---", value: e };
        })}
        value={{ label: dropdownButtonText, value: dropdownButtonText }}
        onChange={(newOption) => {
          setDropdownButtonTextValue(newOption?.value ?? "");
          opportunityForm.updateDraftData(name, newOption?.value ?? "");
        }}
        styles={{
          control: (base) => ({
            ...base,
            minHeight: "unset",
            height: rem(15),
            backgroundColor: `${transparentize(0.9, palette.signal.highlight)}`,
            border: "none",
            borderWidth: "0",
            borderBottom: `1px solid ${palette.signal.links}`,
            borderRadius: "0",
          }),
          valueContainer: (base) => ({
            ...base,
            minHeight: "unset",
            height: "100%",
            padding: "unset",
          }),
          indicatorsContainer: (base) => ({
            ...base,
            display: "none",
          }),
          input: (base) => ({
            ...base,
            isDisabled: true,
          }),
          option: (base) => ({
            ...base,
            backgroundColor: "none",
            color: "black",
            height: "100%",
            "&:hover": {
              backgroundColor: palette.slate10,
            },
          }),
        }}
      />
    </div>
  );
});
