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

import { useState } from "react";

import type { AddClientFormData } from "./AddClientModal";

interface UseClientFormProps {
  onSubmit: (data: AddClientFormData) => Promise<void>;
  onClose: () => void;
}

export function useClientForm({ onSubmit, onClose }: UseClientFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setDay("");
    setMonth("");
    setYear("");
    setState("");
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!firstName.trim()) {
      return "Please enter first name";
    }
    if (!lastName.trim()) {
      return "Please enter last name";
    }
    if (!day || !month || !year) {
      return "Please enter complete date of birth";
    }
    if (!state) {
      return "Please select a state";
    }
    return null;
  };

  const handleSubmit = async () => {
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Format date as YYYY-MM-DD
    const paddedMonth = month.padStart(2, "0");
    const paddedDay = day.padStart(2, "0");
    const isoDateString = `${year}-${paddedMonth}-${paddedDay}`;

    try {
      await onSubmit({
        given_names: firstName.trim(),
        surname: lastName.trim(),
        birthdate: isoDateString,
        state_code: state.trim(),
      });

      resetForm();
    } catch (err: unknown) {
      console.error("Error adding client:", err);
      setError(
        (err as { detail?: string })?.detail ||
          "Failed to add client. Please try again.",
      );
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return {
    // Form state
    firstName,
    setFirstName,
    lastName,
    setLastName,
    day,
    setDay,
    month,
    setMonth,
    year,
    setYear,
    state,
    setState,
    error,
    // Actions
    handleSubmit,
    handleClose,
  };
}
