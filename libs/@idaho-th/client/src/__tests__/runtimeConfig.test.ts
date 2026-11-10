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

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { IDAHO_TH_TRPC_PATH } from "~@idaho-th/shared";

import { getIdahoThRuntimeConfig } from "../runtimeConfig";

describe("getIdahoThRuntimeConfig", () => {
  afterEach(() => {
    delete window.__IDAHO_TH_CONFIG__;
    vi.unstubAllEnvs();
  });

  it("prefers /config.js values over Vite env when present", () => {
    vi.stubEnv("VITE_AUTH0_DOMAIN", "vite.example.com");
    window.__IDAHO_TH_CONFIG__ = {
      AUTH0_DOMAIN: "auth.example.com",
      AUTH0_CLIENT_ID: "client-id",
      AUTH0_AUDIENCE: "https://api.example.com",
      API_URL: IDAHO_TH_TRPC_PATH,
      APP_ENV: "staging",
    };

    expect(getIdahoThRuntimeConfig()).toEqual({
      auth0Domain: "auth.example.com",
      auth0ClientId: "client-id",
      auth0Audience: "https://api.example.com",
      apiUrl: IDAHO_TH_TRPC_PATH,
      appEnv: "staging",
    });
  });

  it("falls back to Vite env when runtime config is an empty object", () => {
    vi.stubEnv("VITE_AUTH0_DOMAIN", "vite.example.com");
    vi.stubEnv("VITE_AUTH0_CLIENT_ID", "vite-client-id");
    vi.stubEnv("VITE_AUTH0_AUDIENCE", "https://vite-api.example.com");
    vi.stubEnv("VITE_IDAHO_TH_API_URL", IDAHO_TH_TRPC_PATH);
    vi.stubEnv("VITE_APP_ENV", "staging");

    window.__IDAHO_TH_CONFIG__ = {};

    expect(getIdahoThRuntimeConfig()).toEqual({
      auth0Domain: "vite.example.com",
      auth0ClientId: "vite-client-id",
      auth0Audience: "https://vite-api.example.com",
      apiUrl: IDAHO_TH_TRPC_PATH,
      appEnv: "staging",
    });
  });

  it("falls back to Vite env when runtime config is absent", () => {
    vi.stubEnv("VITE_AUTH0_DOMAIN", "vite.example.com");
    vi.stubEnv("VITE_AUTH0_CLIENT_ID", "vite-client-id");
    vi.stubEnv("VITE_AUTH0_AUDIENCE", "https://vite-api.example.com");
    vi.stubEnv("VITE_IDAHO_TH_API_URL", IDAHO_TH_TRPC_PATH);

    expect(getIdahoThRuntimeConfig()).toEqual({
      auth0Domain: "vite.example.com",
      auth0ClientId: "vite-client-id",
      auth0Audience: "https://vite-api.example.com",
      apiUrl: IDAHO_TH_TRPC_PATH,
      appEnv: "",
    });
  });

  it("does not mix runtime and Vite env when runtime config is active", () => {
    vi.stubEnv("VITE_AUTH0_DOMAIN", "vite.example.com");
    vi.stubEnv("VITE_AUTH0_CLIENT_ID", "vite-client-id");
    vi.stubEnv("VITE_AUTH0_AUDIENCE", "https://vite-api.example.com");

    window.__IDAHO_TH_CONFIG__ = {
      AUTH0_DOMAIN: "",
      AUTH0_CLIENT_ID: "client-id",
      AUTH0_AUDIENCE: "https://api.example.com",
    };

    expect(() => getIdahoThRuntimeConfig()).toThrow(
      /Missing Idaho TH client config/,
    );
  });

  it("defaults API_URL to IDAHO_TH_TRPC_PATH when unset", () => {
    window.__IDAHO_TH_CONFIG__ = {
      AUTH0_DOMAIN: "auth.example.com",
      AUTH0_CLIENT_ID: "client-id",
      AUTH0_AUDIENCE: "https://api.example.com",
    };

    expect(getIdahoThRuntimeConfig().apiUrl).toBe(IDAHO_TH_TRPC_PATH);
  });

  it("throws when required Auth0 settings are missing", () => {
    window.__IDAHO_TH_CONFIG__ = {};

    expect(() => getIdahoThRuntimeConfig()).toThrow(
      /Missing Idaho TH client config/,
    );
  });

  it("keeps Terraform frontend_api_url aligned with IDAHO_TH_TRPC_PATH", () => {
    const mainTfPath = join(
      __dirname,
      "../../../../atmos/components/terraform/apps/idaho-th/main.tf",
    );
    const mainTf = readFileSync(mainTfPath, "utf8");

    expect(mainTf).toContain(`frontend_api_url = "${IDAHO_TH_TRPC_PATH}"`);
  });

  // Guards against a runtime config key never being forwarded by entrypoint.sh.
  it("keeps entrypoint.sh forwarding every runtime config key to the browser", () => {
    const entrypointPath = join(
      __dirname,
      "../../../../../apps/@idaho-th/client/entrypoint.sh",
    );
    const entrypoint = readFileSync(entrypointPath, "utf8");

    const runtimeKeys: (keyof NonNullable<Window["__IDAHO_TH_CONFIG__"]>)[] = [
      "AUTH0_DOMAIN",
      "AUTH0_CLIENT_ID",
      "AUTH0_AUDIENCE",
      "API_URL",
      "APP_ENV",
      "INTERCOM_APP_ID",
    ];

    for (const key of runtimeKeys) {
      expect(entrypoint).toContain(`--arg ${key} "$${key}"`);
      expect(entrypoint).toContain(`${key}: $${key}`);
    }
  });
});
