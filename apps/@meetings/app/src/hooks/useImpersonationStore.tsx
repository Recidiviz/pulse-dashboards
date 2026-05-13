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

import { create } from "zustand";

export type ImpersonationMetadata = {
  impersonatedEmail: string;
  impersonatedStateCode: string;
  startImpersonating: (email: string, stateCode: string) => void;
  stopImpersonating: () => void;
};

export const useImpersonationStore = create<ImpersonationMetadata>((set) => {
  return {
    impersonatedEmail: "",
    impersonatedStateCode: "",
    startImpersonating: (email: string, stateCode: string) =>
      set({ impersonatedEmail: email, impersonatedStateCode: stateCode }),
    stopImpersonating: () =>
      set({ impersonatedEmail: "", impersonatedStateCode: "" }),
  };
});
