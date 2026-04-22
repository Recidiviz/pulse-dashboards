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

import { useEffect, useState } from "react";

import { mockResourceBankPlan } from "../../tests/mocks/mockPlan";
import { mockResourceBank } from "../../tests/mocks/mockResourceBank";

const MOCK_IS_ERROR = false;

export const useMockResourceBankPlan = (planId: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError] = useState(MOCK_IS_ERROR);
  console.log(`${planId} replaced by mock data`);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 5000);
    return () => clearTimeout(t);
  }, []);

  return {
    data: isLoading || isError ? null : mockResourceBankPlan,
    isLoading,
    isError,
  };
};

export const useMockRessourceAPICall = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError] = useState(MOCK_IS_ERROR);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 10000);
    return () => clearTimeout(t);
  }, []);

  return {
    data: isLoading || isError ? null : mockResourceBank,
    isLoading,
    isError,
  };
};
