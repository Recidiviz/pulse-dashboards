// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { makeObservable, observable } from "mobx";

import { HydrationState } from "../../../core/models/types";
import { constructorSpy } from "../../Opportunity/__tests__/testUtils";
import { QuerySubscription } from "../types";

export class MockQuerySubscription implements QuerySubscription<any> {
  data: any[] = [];

  subscribe = jest.fn();

  unsubscribe = jest.fn();

  hydrate = jest.fn();

  hydrationState: HydrationState = { status: "needs hydration" };

  constructor(...args: any[]) {
    makeObservable(this, {
      data: observable,
      hydrationState: observable,
    });
    constructorSpy(...args);
  }
}
