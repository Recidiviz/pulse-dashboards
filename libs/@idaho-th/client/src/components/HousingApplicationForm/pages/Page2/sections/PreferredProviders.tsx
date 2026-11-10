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

import { useStore } from "@tanstack/react-form";
import React from "react";

import { useHousingProviders } from "../../../../../hooks/housingApplication";
import { paperFormPreferredProviderSlotLabel } from "../../../constants/paperFormFieldLabels";
import { SearchableSelectField } from "../../../Form/Elements";
import { useFormContext } from "../../../FormContext/FormContext";
import * as Styled from "../../../HousingApplicationForm.styles";
import type { HousingApplicationForm } from "../../../types";

export const PreferredProviders: React.FC = function PreferredProviders() {
  const { form } = useFormContext();
  const { providers, isPending: isLoadingProviders } = useHousingProviders();
  const isLoading = isLoadingProviders;
  const selected = useStore(
    form.baseStore,
    (state: { values: HousingApplicationForm }) =>
      state.values.preferredProviders ?? [],
  );

  return (
    <Styled.ImportantFieldsRow>
      {([0, 1, 2] as const).map((idx) => {
        const othersSelected = selected.filter(
          (v: string, i: number) => i !== idx && Boolean(v),
        );
        const options = providers
          .filter((p) => !othersSelected.includes(p.id))
          .map((provider) => ({ value: provider.id, label: provider.name }));
        return (
          <SearchableSelectField
            key={idx}
            name={`preferredProviders[${idx}]`}
            label={paperFormPreferredProviderSlotLabel(idx)}
            options={isLoading ? [] : options}
            placeholder={isLoading ? "Loading…" : "Select…"}
          />
        );
      })}
    </Styled.ImportantFieldsRow>
  );
};
