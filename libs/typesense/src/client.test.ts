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

import { createLocalTypesenseClient, createTypesenseClient } from "./client";

describe("createTypesenseClient", () => {
  it("parses host with explicit port", () => {
    const client = createTypesenseClient({
      host: "http://localhost:8108",
      apiKey: "xyz",
    });
    expect(client.configuration.nodes[0]).toMatchObject({
      host: "localhost",
      port: 8108,
      protocol: "http",
    });
  });

  it("defaults to port 443 for https without explicit port", () => {
    const client = createTypesenseClient({
      host: "https://typesense.example.com",
      apiKey: "xyz",
    });
    expect(client.configuration.nodes[0]).toMatchObject({
      host: "typesense.example.com",
      port: 443,
      protocol: "https",
    });
  });

  it("defaults to port 80 for http without explicit port", () => {
    const client = createTypesenseClient({
      host: "http://typesense.example.com",
      apiKey: "xyz",
    });
    expect(client.configuration.nodes[0]).toMatchObject({
      host: "typesense.example.com",
      port: 80,
      protocol: "http",
    });
  });

  it("uses the provided connectionTimeoutSeconds", () => {
    const client = createTypesenseClient({
      host: "http://localhost:8108",
      apiKey: "xyz",
      connectionTimeoutSeconds: 30,
    });
    expect(client.configuration.connectionTimeoutSeconds).toBe(30);
  });

  it("defaults connectionTimeoutSeconds to 5 when omitted", () => {
    const client = createTypesenseClient({
      host: "http://localhost:8108",
      apiKey: "xyz",
    });
    expect(client.configuration.connectionTimeoutSeconds).toBe(5);
  });

  it("throws on a host that is not a valid URL", () => {
    expect(() =>
      createTypesenseClient({ host: "   ", apiKey: "xyz" }),
    ).toThrow();
  });
});

describe("createLocalTypesenseClient", () => {
  it("uses offline defaults when env vars are unset", () => {
    vi.stubEnv("TYPESENSE_HOST", "");
    vi.stubEnv("TYPESENSE_API_KEY", "");
    const client = createLocalTypesenseClient();
    expect(client.configuration.nodes[0]).toMatchObject({
      host: "localhost",
      port: 8108,
      protocol: "http",
    });
  });

  it("respects TYPESENSE_HOST and TYPESENSE_API_KEY from the environment", () => {
    vi.stubEnv("TYPESENSE_HOST", "https://typesense.staging.example.com:9000");
    vi.stubEnv("TYPESENSE_API_KEY", "staging-key");
    const client = createLocalTypesenseClient();
    expect(client.configuration.nodes[0]).toMatchObject({
      host: "typesense.staging.example.com",
      port: 9000,
      protocol: "https",
    });
  });
});
