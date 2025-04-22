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

import { isEdovoEnv } from "./edovo";

function edovoSubdomain() {
  vi.stubGlobal("location", {
    hostname: "opportunities.edovo.com",
  });
}

function edovoIframe() {
  // iframe detection relies on these not being identical
  vi.stubGlobal("top", { bar: true });
  vi.stubGlobal("parent", {
    foo: true,
    // the outer page also has to be edovo
    location: {
      hostname: "www.edovo.com",
    },
  });
}

function edovoTestIframe() {
  vi.stubGlobal("top", { bar: true });
  vi.stubGlobal("parent", {
    foo: true,

    location: {
      // their test environments look something like this
      hostname: "test-124-abc.tedovo.com",
    },
  });
}

function edovoLandingPage() {
  vi.stubGlobal("location", {
    // this value doesn't matter as long as it's not edovo
    hostname: "foo.bar",
    pathname: "/edovo/token.adfafgasdgasdfs",
  });
}

test.each([
  ["subdomain", edovoSubdomain],
  ["iframe", edovoIframe],
  ["iframe in test env", edovoTestIframe],
  ["landing page", edovoLandingPage],
])("yes if %s", (_, mock) => {
  mock();
  expect(isEdovoEnv()).toBeTrue();
});

test("no if url conditions are not met", () => {
  vi.stubGlobal("location", {
    hostname: "opportunities.app",
    pathname: "/maine",
  });

  expect(isEdovoEnv()).toBeFalse();
});
