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

import { IdahoTHStore } from "~@idaho-th/client";

import { getAuthSettings } from "../auth0/getAuth0Settings";
import { UserStore } from "./UserStore";

export class RootStore {
  userStore: UserStore;

  idahoTHStore: IdahoTHStore;

  constructor() {
    this.userStore = new UserStore(getAuthSettings());
    this.idahoTHStore = new IdahoTHStore(this);
  }
}

export const rootStore = new RootStore();
