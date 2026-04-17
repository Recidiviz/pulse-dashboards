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

import { useState } from "react";

import { mockResourceBankPlan } from "../../tests/mocks/mockPlan";
import { mockResourceBank } from "../../tests/mocks/mockResourceBank";

// Toggle these to test loading/error states during development.
const MOCK_IS_LOADING = false;
const MOCK_IS_ERROR = false;

export const useMockResourceBankPlan = (planId: string) => {
  // useState keeps isLoading/isError easy to toggle dynamically if needed.
  const [isLoading] = useState(MOCK_IS_LOADING);
  const [isError] = useState(MOCK_IS_ERROR);
  console.log(`${planId} replaced by mock data`);
  return {
    data: isLoading || isError ? null : mockResourceBankPlan,
    // In a real API call, you can have data and loading, when re-fetching.
    // here, for simplicity, we remove data when loading to view loading state easily
    isLoading,
    isError,
  };
};

export const useMockRessourceAPICall = () => {
  // useState keeps isLoading/isError easy to toggle dynamically if needed.
  const [isLoading] = useState(MOCK_IS_LOADING);
  const [isError] = useState(MOCK_IS_ERROR);

  return {
    data: isLoading || isError ? null : mockResourceBank,
    // In a real API call, you can have data and loading, when re-fetching.
    // here, for simplicity, we remove data when loading to view loading state easily
    isLoading,
    isError,
  };
};
