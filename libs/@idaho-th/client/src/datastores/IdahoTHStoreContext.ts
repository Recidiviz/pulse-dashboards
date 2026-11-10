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

import { createContext, useContext } from "react";

import type { HousingApplicationsStore } from "./HousingApplicationsStore";
import type { HousingProviderStore } from "./HousingProviderStore";
import { IdahoTHStore } from "./IdahoTHStore";
import type { PreviewModalStore } from "./PreviewModalStore";

export const IdahoTHStoreContext = createContext<IdahoTHStore | undefined>(
  undefined,
);

export const useIdahoTHStore = (): IdahoTHStore => {
  const store = useContext(IdahoTHStoreContext);
  if (!store)
    throw new Error("useIdahoTHStore must be used within a StoreProvider");
  return store;
};

export const useHousingApplicationsStore = (): HousingApplicationsStore => {
  return useIdahoTHStore().housingApplicationsStore;
};

export const usePreviewModalStore = (): PreviewModalStore => {
  return useIdahoTHStore().previewModalStore;
};

export const useHousingProviderStore = (): HousingProviderStore => {
  return useIdahoTHStore().housingProviderStore;
};

export const useUserStore = () => {
  return useIdahoTHStore().rootStore.userStore;
};
