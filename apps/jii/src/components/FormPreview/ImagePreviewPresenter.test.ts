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
import { flowResult } from "mobx";

import { ResidentsStore } from "../../datastores/ResidentsStore";
import { RootStore } from "../../datastores/RootStore";
import { ImagePreviewPresenter } from "./ImagePreviewPresenter";

let presenter: ImagePreviewPresenter;
let rootStore: RootStore;

beforeEach(async () => {
  rootStore = new RootStore();
  await flowResult(rootStore.populateResidentsStore());

  presenter = new ImagePreviewPresenter(
    "sccp",
    rootStore.residentsStore as ResidentsStore,
  );
});

test("form title", () => {
  expect(presenter.title).toMatchInlineSnapshot(`"SCCP Application"`);
});

test("lookup images", () => {
  // during tests this will be an absolute filesystem path,
  // so we don't want to match the whole thing
  expect(presenter.currentUrl).toMatch(
    new RegExp(
      "libs/shared-assets/src/images/form-previews/US_ME/SCCP/p1.png$",
    ),
  );
});

test("next image", () => {
  presenter.next();

  expect(presenter.currentUrl).toMatch(
    new RegExp(
      "libs/shared-assets/src/images/form-previews/US_ME/SCCP/p2.png$",
    ),
  );
});

test("previous image", () => {
  presenter.next();
  presenter.previous();

  expect(presenter.currentUrl).toMatch(
    new RegExp(
      "libs/shared-assets/src/images/form-previews/US_ME/SCCP/p1.png$",
    ),
  );
});

test("images loop", () => {
  presenter.previous();
  expect(presenter.currentUrl).toMatch(
    new RegExp(
      "libs/shared-assets/src/images/form-previews/US_ME/SCCP/p10.png$",
    ),
  );

  presenter.next();
  expect(presenter.currentUrl).toMatch(
    new RegExp(
      "libs/shared-assets/src/images/form-previews/US_ME/SCCP/p1.png$",
    ),
  );
});

test("progress", () => {
  expect(presenter.currentPage).toBe(1);
  expect(presenter.totalPages).toBe(10);

  presenter.next();
  expect(presenter.currentPage).toBe(2);

  presenter.previous();
  presenter.previous();
  expect(presenter.currentPage).toBe(10);
});

test("unknown URL", () => {
  presenter = new ImagePreviewPresenter(
    "not-configured",
    rootStore.residentsStore as ResidentsStore,
  );

  expect(() => presenter.title).toThrowErrorMatchingInlineSnapshot(
    `[Error: No opportunity ID matches url not-configured]`,
  );
  expect(() => presenter.currentUrl).toThrowErrorMatchingInlineSnapshot(
    `[Error: No opportunity ID matches url not-configured]`,
  );
});
