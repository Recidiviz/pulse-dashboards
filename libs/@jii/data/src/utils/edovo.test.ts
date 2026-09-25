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

import {
  consumeEdovoReferralReturnPath,
  isEdovoEnv,
  sendEdovoReferral,
} from "./edovo";

function edovoSubdomain() {
  vi.stubGlobal("location", {
    hostname: "opportunities.edovo.com",
  });
}

function edovoIframe() {
  vi.stubGlobal("parent", {
    foo: true,
    // the outer page also has to be edovo
    location: {
      hostname: "www.edovo.com",
    },
  });
}

function edovoTestIframe() {
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
    pathname: "/foo",
  });

  expect(isEdovoEnv()).toBeFalse();
});

describe("sendEdovoReferral", () => {
  let postMessage: ReturnType<typeof vi.fn>;

  function framedBy(referrer: string) {
    vi.spyOn(document, "referrer", "get").mockReturnValue(referrer);
    postMessage = vi.fn();
    vi.stubGlobal("parent", { postMessage });
  }

  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("location", {
      hostname: "opportunities.edovo.com",
      pathname: "/co/abc123/programs",
    });
  });

  test("sends the id to the Edovo parent and saves the return state", () => {
    framedBy("https://go.edovo.com/courses");

    expect(sendEdovoReferral()).toBe(true);
    expect(postMessage).toHaveBeenCalledWith(
      { type: "program-navigation", sessionResumeId: expect.any(String) },
      "https://go.edovo.com",
    );
    const saved = JSON.parse(localStorage.getItem("edovoReturnState") ?? "");
    expect(saved.returnPath).toBe("/co/abc123/programs");
  });

  test.each([
    ["there is no referrer", ""],
    ["the parent is not an Edovo domain", "https://notedovo.com/x"],
  ])("does nothing when %s", (_, referrer) => {
    framedBy(referrer);

    expect(sendEdovoReferral()).toBe(false);
    expect(postMessage).not.toHaveBeenCalled();
    expect(localStorage.getItem("edovoReturnState")).toBeNull();
  });

  test("does nothing outside an iframe", () => {
    vi.spyOn(document, "referrer", "get").mockReturnValue(
      "https://go.edovo.com/courses",
    );
    // outside an iframe, window.parent is window itself
    const windowPostMessage = vi.spyOn(window, "postMessage");

    expect(sendEdovoReferral()).toBe(false);
    expect(windowPostMessage).not.toHaveBeenCalled();
    expect(localStorage.getItem("edovoReturnState")).toBeNull();
  });
});

describe("consumeEdovoReferralReturnPath", () => {
  beforeEach(() => {
    localStorage.clear();
    // what sendEdovoReferral would have saved
    localStorage.setItem(
      "edovoReturnState",
      JSON.stringify({ sessionResumeId: "abc", returnPath: "/co/x/programs" }),
    );
  });

  test("returns the saved path when the id matches", () => {
    expect(consumeEdovoReferralReturnPath("abc")).toBe("/co/x/programs");
    expect(localStorage.getItem("edovoReturnState")).toBeNull();
  });

  test("returns nothing without an id", () => {
    expect(consumeEdovoReferralReturnPath()).toBeUndefined();
    expect(localStorage.getItem("edovoReturnState")).toBeNull();
  });

  test("returns nothing when the id doesn't match", () => {
    expect(consumeEdovoReferralReturnPath("edf")).toBeUndefined();
    expect(localStorage.getItem("edovoReturnState")).toBeNull();
  });

  test("returns nothing when nothing was saved", () => {
    localStorage.clear();
    expect(consumeEdovoReferralReturnPath("abc")).toBeUndefined();
  });

  test("returns nothing when the saved state is corrupted", () => {
    localStorage.setItem("edovoReturnState", "not json");
    expect(consumeEdovoReferralReturnPath("abc")).toBeUndefined();
  });

  test("returns nothing when localStorage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("storage blocked");
      },
    });
    expect(consumeEdovoReferralReturnPath("abc")).toBeUndefined();
  });
});
