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

import { waitFor } from "@testing-library/react";
import { MockInstance } from "vitest";

import { Permission } from "~@jii/auth";
import { TRANSLATOR_MODE_LANGUAGE_CODE } from "~@jii/translation";

import { RootStore } from "./RootStore";
import { TranslationStore } from "./TranslationStore";
import { UserStore } from "./UserStore";

let rootStore: RootStore;
let store: TranslationStore;
let permissionSpy: MockInstance<(permission: Permission) => boolean>;

beforeEach(() => {
  // Reasonable default for most users
  vi.stubGlobal("navigator", { language: "en-US" });

  permissionSpy = vi.spyOn(UserStore.prototype, "hasPermission");
  rootStore = new RootStore();
  store = new TranslationStore(rootStore);
});

describe("unrestricted state", () => {
  test("default language", () => {
    expect(store.i18n.language).toBe("en-US");
    expect(store.currentLanguage).toBe("en-US");
    expect(store.isTranslatorModeActive).toBeFalse();
  });

  test("no language restrictions", async () => {
    await store.i18n.changeLanguage("fooo");
    expect(store.i18n.language).toBe("fooo");
    expect(store.currentLanguage).toBe("fooo");
  });

  test("translator mode requires permission", async () => {
    // the change happens async but we don't actually expect it to change,
    // so spying on the call is the only way to really verify behavior
    const changeLanguageSpy = vi.spyOn(store.i18n, "changeLanguage");
    expect(store.isTranslatorModeActive).toBeFalse();
    store.isTranslatorModeActive = true;
    expect(changeLanguageSpy).not.toHaveBeenCalledWith(
      TRANSLATOR_MODE_LANGUAGE_CODE,
    );
  });

  describe("with translator permission", () => {
    beforeEach(() => {
      permissionSpy.mockImplementation((p) => p === "translator");
    });

    test("enter translator mode", async () => {
      store.isTranslatorModeActive = true;
      await waitFor(() => expect(store.isTranslatorModeActive).toBeTrue());
    });

    test("remember previous language when exiting translator mode", async () => {
      await store.i18n.changeLanguage("es-US");
      expect(store.currentLanguage).toBe("es-US");

      store.isTranslatorModeActive = true;
      await waitFor(() => expect(store.isTranslatorModeActive).toBeTrue());

      store.isTranslatorModeActive = false;
      await waitFor(() => expect(store.isTranslatorModeActive).toBeFalse());
      expect(store.currentLanguage).toBe("es-US");
    });
  });
});

describe("restricted state", () => {
  test("overrides restricted languages", async () => {
    // set a different language while unrestricted
    await store.i18n.changeLanguage("es");
    expect(store.currentLanguage).toBe("es");

    // disallow the set language
    store.updateI18n({ additionalLanguages: [] });
    // when a detected language is unsupported we fall back to the system setting
    // before the configured fallback (see `navigator` stub above). variants of english
    // are supported even though in practice they do fall back to "en" for their resources
    expect(store.i18n.language).toBe("en-US");
    expect(store.currentLanguage).toBe("en-US");
  });

  test("disregards disallowed language changes", async () => {
    store.updateI18n({ additionalLanguages: [] });
    await store.i18n.changeLanguage("es");

    // unlike preceding test, when explicitly setting an unsupported language
    // we wind up at the configured fallback language, not the system setting
    expect(store.i18n.language).toBe("en");
    expect(store.currentLanguage).toBe("en");
  });

  test("translator permission overrides restrictions", async () => {
    permissionSpy.mockImplementation((p) => p === "translator");

    store.updateI18n({ additionalLanguages: [] });
    await store.i18n.changeLanguage("es");

    expect(store.i18n.language).toBe("es");
    expect(store.currentLanguage).toBe("es");
  });
});
