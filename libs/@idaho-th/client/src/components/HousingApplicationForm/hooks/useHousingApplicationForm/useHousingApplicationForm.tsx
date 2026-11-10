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

import { useForm, useStore } from "@tanstack/react-form";
import { useCallback, useMemo, useState } from "react";

import { useHousingProviders } from "../../../../hooks/housingApplication";
import type { HousingApplicationForm } from "../../types";
import { housingApplicationSchema, STEP_VALIDATION_SCHEMA } from "./schema";
import {
  BLOCKING_FIELDS,
  computeWarningFields,
  DEFAULT_FORM_VALUES,
  getErrorForField,
  handleInputChange,
  type HousingApplicationField,
  normalizeDefaultValues,
} from "./utils";

export function useHousingApplicationForm(
  defaultValues: HousingApplicationForm | undefined,
) {
  const initFormValues = useMemo(
    () =>
      defaultValues
        ? normalizeDefaultValues(defaultValues)
        : DEFAULT_FORM_VALUES,
    [defaultValues],
  );

  const form = useForm({
    defaultValues: initFormValues,
    validators: {
      onChange: ({ value }) =>
        housingApplicationSchema.safeParse(value).error?.formErrors.fieldErrors,
    },
    onSubmit: async () => {
      // no-op for now; pages 2-4 + submission will be added later
    },
  });
  const errors = useStore(form.store, (s) => s.errors);
  const values = useStore(form.store, (s) => s.values);
  const [step, setStep] = useState<number>(1);

  // Pre fetching housing providers for page 2 to avoid loading states there
  useHousingProviders();

  const validationMessageForField = useCallback(
    (fieldName: HousingApplicationField) => getErrorForField(errors, fieldName),
    [errors],
  );

  const warningFields = computeWarningFields(values);

  const variantFor = (fieldName: HousingApplicationField, error?: string) => {
    if (error) return BLOCKING_FIELDS.includes(fieldName) ? "error" : "warning";
    if (warningFields.has(fieldName)) return "warning";
    return "valid";
  };

  const canProceed = () => {
    const stepSchema = STEP_VALIDATION_SCHEMA[step];
    if (!stepSchema) {
      return true;
    }
    return stepSchema.safeParse(values).success;
  };

  return {
    form,
    step,
    setStep,
    values,
    warningFields,
    variantFor,
    canProceed,
    validationMessageForField,
    handleInputChange,
  } as const;
}
