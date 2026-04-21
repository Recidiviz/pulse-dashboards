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

import { observer } from "mobx-react-lite";
import { useState } from "react";

import { Icon, IconSVG } from "~design-system";

import { localDateFromUtcDate } from "../../../../utils/utils";
import { SharedDatePicker } from "../../../shared/SharedDatePicker";
import { useStore } from "../../../StoreProvider/StoreProvider";
import * as Styled from "../../CaseDetails.styles";
import { CUSTOM_DUE_DATE_KEY } from "../../constants";
import { form } from "../FormStore";
import { FormFieldProps } from "../types";

function CustomDueDateField({ isRequired }: FormFieldProps) {
  const { PSIStore } = useStore();
  const caseAttributes = PSIStore.caseAttributes;

  const initialPickerDate: Date | undefined = caseAttributes.dueDate
    ? localDateFromUtcDate(caseAttributes.dueDate)
    : undefined;

  const [pickerDate, setPickerDate] = useState<Date | null | undefined>(
    initialPickerDate,
  );

  function updateCustomDueDate(date: Date | null | undefined) {
    if (date) {
      setPickerDate(date);
      const utcNormalized = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
      );
      form.updateForm(CUSTOM_DUE_DATE_KEY, utcNormalized);
    } else {
      setPickerDate(initialPickerDate);
      form.updateForm(CUSTOM_DUE_DATE_KEY, caseAttributes.dueDate);
    }
  }

  return (
    <>
      <Styled.InputLabel>
        Due {isRequired && <span>Required*</span>}
      </Styled.InputLabel>
      <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
        <SharedDatePicker
          selected={pickerDate}
          onChange={(date: Date | null) => updateCustomDueDate(date)}
          showIcon
          icon={<Icon kind={IconSVG["Calendar"]} />}
          placeholder="Select date"
          resetButton={
            pickerDate !== caseAttributes.dueDate && (
              <div>
                <Styled.CalendarResetButton
                  type="button"
                  onClick={() => updateCustomDueDate(caseAttributes.dueDate)}
                >
                  Reset
                </Styled.CalendarResetButton>
              </div>
            )
          }
        />
      </div>
    </>
  );
}

export default observer(CustomDueDateField);
