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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import ReactSelect from "react-select";
import styled from "styled-components";

import { ParoleResidentsPresenter } from "../../../ParoleStore/presenters/ParoleResidentsPresenter";
import {
  caseloadSelectStyles,
  ClearAll,
  MenuListWithShadow,
  MultiValue,
  SelectOption,
  ValueRemover,
} from "../../CaseloadSelect";

const SelectWrapper = styled.div`
  margin-bottom: ${rem(spacing.lg)};
`;

/**
 * Multi-select of the tenant's facilities. Styled to match the Workflows
 * caseload search, which the residents list is modeled on.
 */
export const ParoleFacilitySelect = observer(function ParoleFacilitySelect({
  presenter,
}: {
  presenter: ParoleResidentsPresenter;
}) {
  const options: Array<SelectOption> = presenter.facilities.map((facility) => ({
    label: facility.name,
    value: facility.facilityId,
  }));
  const optionsByFacilityId = new Map(
    options.map((option) => [option.value, option]),
  );

  return (
    <SelectWrapper>
      <ReactSelect
        aria-label="Search for one or more facilities"
        classNamePrefix="ParoleFacilitySelect"
        components={{
          ClearIndicator: ClearAll,
          DropdownIndicator: null,
          MenuList: MenuListWithShadow(options.length, { isDisabled: false }),
          MultiValue,
          MultiValueRemove: ValueRemover,
        }}
        isMulti
        onChange={(selected) =>
          presenter.setSelectedFacilityIds(
            selected.map((option) => option.value),
          )
        }
        options={options}
        placeholder="Search for one or more facilities …"
        styles={caseloadSelectStyles(false, false)}
        value={presenter.selectedFacilityIds.flatMap(
          (facilityId) => optionsByFacilityId.get(facilityId) ?? [],
        )}
      />
    </SelectWrapper>
  );
});
