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

import { Client, WorkflowsStore } from "../../../WorkflowsStore";
import { RoutePlannerClientsPresenter } from "../RoutePlannerClientsPresenter";

const mockWorkflowsStore = {
  searchStore: {
    selectedSearchIds: [],
  },
} as any as WorkflowsStore;
let presenter: RoutePlannerClientsPresenter;

const clients = [
  { pseudonymizedId: "test123" },
  { pseudonymizedId: "test456" },
  { pseudonymizedId: "test789" },
] as Client[];

beforeEach(() => {
  presenter = new RoutePlannerClientsPresenter(mockWorkflowsStore);
});

describe("Selected person methods", () => {
  it("Reports clients are selected after they are added", () => {
    presenter.addPerson(clients[0]);
    presenter.addPerson(clients[1]);

    expect(presenter.isPersonSelected(clients[0])).toBeTrue();
    expect(presenter.indexOfPerson(clients[0])).toEqual(0);
    expect(presenter.isPersonSelected(clients[1])).toBeTrue();
    expect(presenter.indexOfPerson(clients[1])).toEqual(1);
  });

  it("No longer reports clients are selected after they are removed", () => {
    presenter.addPerson(clients[0]);
    expect(presenter.isPersonSelected(clients[0])).toBeTrue();
    expect(presenter.indexOfPerson(clients[0])).toEqual(0);

    presenter.removePerson(clients[0]);
    expect(presenter.isPersonSelected(clients[0])).toBeFalse();
    expect(presenter.indexOfPerson(clients[0])).toEqual(-1);
  });

  it("Changes sequence of clients when removed out of order", () => {
    presenter.addPerson(clients[0]);
    presenter.addPerson(clients[1]);
    presenter.addPerson(clients[2]);
    presenter.removePerson(clients[0]);

    expect(presenter.isPersonSelected(clients[0])).toBeFalse();
    expect(presenter.indexOfPerson(clients[0])).toEqual(-1);

    expect(presenter.isPersonSelected(clients[1])).toBeTrue();
    expect(presenter.indexOfPerson(clients[1])).toEqual(0);

    expect(presenter.isPersonSelected(clients[2])).toBeTrue();
    expect(presenter.indexOfPerson(clients[2])).toEqual(1);
  });
});
