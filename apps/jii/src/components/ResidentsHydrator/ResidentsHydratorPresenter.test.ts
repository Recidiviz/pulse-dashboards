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

import { configure } from "mobx";

import { outputFixture, usMeResidents } from "~datatypes";

import { ResidentsStore } from "../../datastores/ResidentsStore";
import { RootStore } from "../../datastores/RootStore";
import { ResidentsHydratorPresenter } from "./ResidentsHydratorPresenter";

let store: RootStore;
let presenter: ResidentsHydratorPresenter;

beforeEach(() => {
  configure({ safeDescriptors: false });
  store = new RootStore();
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

describe("without resident specified", () => {
  beforeEach(() => {
    presenter = new ResidentsHydratorPresenter(store);
  });

  test("hydrate", async () => {
    vi.spyOn(RootStore.prototype, "populateResidentsStore");

    expect(presenter.hydrationState).toEqual({ status: "needs hydration" });

    const hydrationPromise = presenter.hydrate();
    expect(presenter.hydrationState).toEqual({ status: "loading" });

    await hydrationPromise;

    expect(presenter.hydrationState).toEqual({ status: "hydrated" });
    expect(store.populateResidentsStore).toHaveBeenCalled();

    expect(store.residentsStore).toBeDefined();
  });

  test("hydration error", async () => {
    const err = new Error("oops");
    vi.spyOn(RootStore.prototype, "populateResidentsStore").mockImplementation(
      () => {
        throw err;
      },
    );

    await presenter.hydrate();

    expect(presenter.hydrationState).toEqual({ status: "failed", error: err });
  });

  test("no redundant hydration while in progress", async () => {
    vi.spyOn(store, "populateResidentsStore");

    const h1 = presenter.hydrate();
    const h2 = presenter.hydrate();

    await Promise.all([h1, h2]);
    expect(store.populateResidentsStore).toHaveBeenCalledTimes(1);
  });

  test("don't hydrate if already hydrated", async () => {
    vi.spyOn(store, "populateResidentsStore");

    await presenter.hydrate();
    expect(presenter.hydrationState).toEqual({ status: "hydrated" });
    presenter.hydrate();

    expect(store.populateResidentsStore).toHaveBeenCalledTimes(1);
  });
});

describe("with resident specified", () => {
  const expectedResident = outputFixture(usMeResidents[0]);

  beforeEach(() => {
    presenter = new ResidentsHydratorPresenter(
      store,
      expectedResident.pseudonymizedId,
    );
  });

  test("hydrate", async () => {
    const spy = vi.spyOn(
      ResidentsStore.prototype,
      "populateResidentByPseudoId",
    );

    expect(presenter.hydrationState).toEqual({ status: "needs hydration" });
    expect(store.residentsStore).toBeUndefined();

    const hydrationPromise = presenter.hydrate();
    expect(presenter.hydrationState).toEqual({ status: "loading" });

    await hydrationPromise;

    expect(presenter.hydrationState).toEqual({ status: "hydrated" });
    expect(spy).toHaveBeenCalledWith(expectedResident.pseudonymizedId);

    expect(presenter.activeResident).toEqual(expectedResident);
  });

  test("hydration error", async () => {
    const err = new Error("oops");
    vi.spyOn(
      ResidentsStore.prototype,
      "populateResidentByPseudoId",
    ).mockImplementation(() => {
      throw err;
    });

    await presenter.hydrate();

    expect(presenter.hydrationState).toEqual({ status: "failed", error: err });
  });

  test("no redundant hydration while in progress", async () => {
    const spy = vi.spyOn(
      ResidentsStore.prototype,
      "populateResidentByPseudoId",
    );

    const h1 = presenter.hydrate();
    const h2 = presenter.hydrate();

    await Promise.all([h1, h2]);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("don't hydrate if already hydrated", async () => {
    const spy = vi.spyOn(
      ResidentsStore.prototype,
      "populateResidentByPseudoId",
    );

    await presenter.hydrate();
    expect(presenter.hydrationState).toEqual({ status: "hydrated" });
    presenter.hydrate();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("with resident user", () => {
  const expectedResident = outputFixture(usMeResidents[0]);

  beforeEach(() => {
    vi.spyOn(store.userStore, "externalId", "get").mockReturnValue(
      expectedResident.personExternalId,
    );
    presenter = new ResidentsHydratorPresenter(store);
  });

  test("hydrate", async () => {
    const spy = vi.spyOn(ResidentsStore.prototype, "populateResidentById");

    expect(presenter.hydrationState).toEqual({ status: "needs hydration" });
    expect(store.residentsStore).toBeUndefined();

    const hydrationPromise = presenter.hydrate();
    expect(presenter.hydrationState).toEqual({ status: "loading" });

    await hydrationPromise;

    expect(presenter.hydrationState).toEqual({ status: "hydrated" });
    expect(spy).toHaveBeenCalledWith(expectedResident.personExternalId);

    expect(presenter.activeResident).toEqual(expectedResident);
  });

  test("hydration error", async () => {
    const err = new Error("oops");
    vi.spyOn(
      ResidentsStore.prototype,
      "populateResidentById",
    ).mockImplementation(() => {
      throw err;
    });

    await presenter.hydrate();

    expect(presenter.hydrationState).toEqual({ status: "failed", error: err });
  });

  test("no redundant hydration while in progress", async () => {
    const spy = vi.spyOn(ResidentsStore.prototype, "populateResidentById");

    const h1 = presenter.hydrate();
    const h2 = presenter.hydrate();

    await Promise.all([h1, h2]);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("don't hydrate if already hydrated", async () => {
    const spy = vi.spyOn(ResidentsStore.prototype, "populateResidentById");

    await presenter.hydrate();
    expect(presenter.hydrationState).toEqual({ status: "hydrated" });
    presenter.hydrate();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
