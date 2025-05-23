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

import { makeAutoObservable } from "mobx";

import type TenantStore from "../../RootStore/TenantStore";
import { TenantId } from "../../RootStore/types";
import type UserStore from "../../RootStore/UserStore";
import { PopulationFilterValues } from "../types/filters";
import {
  DASHBOARD_VIEWS,
  DashboardView,
  DEFAULT_PATHWAYS_PAGE,
  DEFAULT_PATHWAYS_SECTION_BY_PAGE,
  PATHWAYS_PAGES,
  PathwaysPage,
  PathwaysSection,
} from "../views";
import FiltersStore from "./FiltersStore";
import MetricsStore from "./MetricsStore";
import VitalsStore from "./VitalsStore";

interface CoreStoreProps {
  userStore: UserStore;
  tenantStore: TenantStore;
}

export default class CoreStore {
  userStore: UserStore;

  tenantStore: TenantStore;

  filtersStore: FiltersStore = new FiltersStore({ rootStore: this });

  metricsStore: MetricsStore = new MetricsStore({ rootStore: this });

  vitalsStore: VitalsStore;

  view: DashboardView = DASHBOARD_VIEWS.operations;

  page: PathwaysPage = PATHWAYS_PAGES.prison;

  section: PathwaysSection =
    DEFAULT_PATHWAYS_SECTION_BY_PAGE[DEFAULT_PATHWAYS_PAGE];

  constructor({ userStore, tenantStore }: CoreStoreProps) {
    makeAutoObservable(this);

    this.userStore = userStore;

    this.tenantStore = tenantStore;

    this.vitalsStore = new VitalsStore({
      rootStore: this,
    });

    this.setView = this.setView.bind(this);

    this.setPage = this.setPage.bind(this);

    this.setSection = this.setSection.bind(this);
  }

  setView(view: DashboardView): void {
    this.view = view;
  }

  setPage(page: PathwaysPage): void {
    this.page = page;
  }

  setSection(section: PathwaysSection): void {
    this.section = section;
  }

  get filters(): PopulationFilterValues {
    return this.filtersStore.filters;
  }

  get currentTenantId(): TenantId | undefined {
    if (!this.tenantStore.currentTenantId) return undefined;
    return this.tenantStore.currentTenantId as TenantId;
  }
}
