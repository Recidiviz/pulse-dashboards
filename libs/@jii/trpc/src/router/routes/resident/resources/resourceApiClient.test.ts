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

import { captureException } from "@sentry/node";

import { resourceApiClient } from "./resourceApiClient";

vi.mock("@sentry/node", () => ({ captureException: vi.fn() }));

vi.mock("../../../../helpers/createCachedCall", () => ({
  createCachedCall: <T>(fn: () => T) => fn,
}));

const BASE_URL = "https://test-api.example.com";
const API_KEY = "test-key";
const US_NYC_STATE_CODE = "US_NYC";

function mockFetch(
  body: unknown,
  ok = true,
  {
    status = ok ? 200 : 500,
    text = "",
  }: { status?: number; text?: string } = {},
) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
    text: async () => text,
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => {
  vi.stubEnv("RESOURCE_API_BASE_URL", BASE_URL);
  vi.stubEnv("RESOURCE_API_KEY", API_KEY);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("getOrganizations", () => {
  test("maps id → organizationId and section/subsection → category/subcategory", async () => {
    mockFetch([
      {
        id: 1,
        name: "Women's Prison Association",
        description: "Support for women with incarcerated loved ones.",
        attributes: {
          categorizations: [{ section: "Women", subsection: "Organizations" }],
          tags: ["women", "organizations"],
        },
        primary_contact_method: "PHONE",
        primary_contact_value: "212-555-0100",
      },
    ]);

    const result = await resourceApiClient.getOrganizations(US_NYC_STATE_CODE);

    expect(result).toEqual([
      {
        organizationId: 1,
        name: "Women's Prison Association",
        description: "Support for women with incarcerated loved ones.",
        categories: [{ category: "Women", subcategory: "Organizations" }],
        tags: ["Organizations", "Women"],
        primaryContactMethod: "PHONE",
        primaryContactValue: "212-555-0100",
      },
    ]);
  });

  test("includes all categorizations per organization", async () => {
    mockFetch([
      {
        id: 2,
        name: "Osborne Association",
        attributes: {
          categorizations: [
            { section: "Employment", subsection: "Job Training" },
            { section: "Housing", subsection: "Transitional Housing" },
          ],
          tags: [],
        },
      },
    ]);

    const result = await resourceApiClient.getOrganizations(US_NYC_STATE_CODE);

    expect(result[0].categories).toEqual([
      { category: "Employment", subcategory: "Job Training" },
      { category: "Housing", subcategory: "Transitional Housing" },
    ]);
  });

  test("maps multiple organizations", async () => {
    mockFetch([
      {
        id: 1,
        name: "Women's Prison Association",
        attributes: {
          categorizations: [{ section: "Women", subsection: "Organizations" }],
          tags: [],
        },
      },
      {
        id: 2,
        name: "Osborne Association",
        attributes: {
          categorizations: [
            { section: "Employment", subsection: "Job Training" },
          ],
          tags: [],
        },
      },
    ]);

    const result = await resourceApiClient.getOrganizations(US_NYC_STATE_CODE);

    expect(result).toHaveLength(2);
    expect(result[0].organizationId).toBe(1);
    expect(result[1].organizationId).toBe(2);
  });

  test("coalesces missing optional fields to undefined", async () => {
    mockFetch([
      {
        id: 3,
        name: "Test Org",
        attributes: { categorizations: [], tags: [] },
      },
    ]);

    const result = await resourceApiClient.getOrganizations(US_NYC_STATE_CODE);

    expect(result[0].description).toBeUndefined();
    expect(result[0].primaryContactMethod).toBeUndefined();
    expect(result[0].primaryContactValue).toBeUndefined();
  });

  test("sends POST to /api/v1/organizations with origin in body", async () => {
    const fetch = mockFetch([]);

    await resourceApiClient.getOrganizations(US_NYC_STATE_CODE);

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/api/v1/organizations`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ origin: "NYC_CONNECTIONS" }),
      }),
    );
  });

  test("throws when the response is not an array", async () => {
    mockFetch({ detail: "unexpected" });

    await expect(
      resourceApiClient.getOrganizations(US_NYC_STATE_CODE),
    ).rejects.toThrow();
  });

  test("sends the CURATED origin for US_MA", async () => {
    const fetch = mockFetch([]);

    await resourceApiClient.getOrganizations("US_MA");

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/api/v1/organizations`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ origin: "CURATED" }),
      }),
    );
  });
});

describe("getOrganization", () => {
  test("maps all fields correctly", async () => {
    mockFetch({
      id: 42,
      name: "Legal Aid Society",
      description: "Free civil legal services for low-income New Yorkers.",
      attributes: {
        categorizations: [{ section: "Legal", subsection: "Public Defense" }],
        tags: ["legal", "civil"],
      },
      primary_contact_method: "ADDRESS",
      primary_contact_value: "199 Water St, New York, NY 10038",
      addresses: [
        {
          id: 101,
          address: "199 Water St, New York, NY 10038",
          google_place_id: "ChIJabc123",
          label: "Main Office",
        },
      ],
      phone_numbers: [
        { id: 201, phone_number: "212-577-3300", label: null, address_id: 101 },
      ],
      websites: [{ id: 301, url: "https://legalaidnyc.org", address_id: null }],
    });

    const result = await resourceApiClient.getOrganization(42);

    expect(result).toEqual({
      organizationId: 42,
      name: "Legal Aid Society",
      description: "Free civil legal services for low-income New Yorkers.",
      categories: [{ category: "Legal", subcategory: "Public Defense" }],
      tags: ["Civil", "Legal"],
      primaryContactMethod: "ADDRESS",
      primaryContactValue: "199 Water St, New York, NY 10038",
      addresses: [
        {
          id: 101,
          address: "199 Water St, New York, NY 10038",
          googlePlaceId: "ChIJabc123",
          label: "Main Office",
        },
      ],
      phoneNumbers: [
        {
          id: 201,
          phoneNumber: "212-577-3300",
          label: undefined,
          addressId: 101,
        },
      ],
      websites: [
        { id: 301, url: "https://legalaidnyc.org", addressId: undefined },
      ],
    });
  });

  test("coalesces undefined optional fields to undefined", async () => {
    mockFetch({
      id: 42,
      name: "Legal Aid Society",
      attributes: {
        categorizations: [{ section: "Legal", subsection: "Public Defense" }],
        tags: [],
      },
      addresses: [],
      phone_numbers: [],
      websites: [],
    });

    const result = await resourceApiClient.getOrganization(42);

    expect(result.description).toBeUndefined();
    expect(result.primaryContactMethod).toBeUndefined();
    expect(result.primaryContactValue).toBeUndefined();
    expect(result.addresses).toEqual([]);
    expect(result.phoneNumbers).toEqual([]);
    expect(result.websites).toEqual([]);
  });

  test("coalesces null fields within nested address and phone objects to undefined", async () => {
    mockFetch({
      id: 42,
      name: "Test Org",
      attributes: { categorizations: [], tags: [] },
      addresses: [
        {
          id: 1,
          address: "123 Main St",
          google_place_id: null,
          label: null,
        },
      ],
      phone_numbers: [
        { id: 1, phone_number: "212-555-0100", label: null, address_id: null },
      ],
      websites: [],
    });

    const result = await resourceApiClient.getOrganization(42);

    expect(result.addresses[0].label).toBeUndefined();
    expect(result.phoneNumbers[0].addressId).toBeUndefined();
  });

  test("sends POST to /api/v1/organization with id in body", async () => {
    const fetch = mockFetch({
      id: 42,
      name: "Test Org",
      attributes: { categorizations: [], tags: [] },
      addresses: [],
      phone_numbers: [],
      websites: [],
    });

    await resourceApiClient.getOrganization(42);

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/api/v1/organization`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ id: 42 }),
      }),
    );
  });

  test("maps multiple addresses and phone numbers", async () => {
    mockFetch({
      id: 506,
      name: "Venture House",
      attributes: { categorizations: [], tags: [] },
      addresses: [
        {
          id: 383,
          address: "2477 Webster Avenue, Bronx, NY 10458",
          google_place_id: "ChIJLb1Ag4DzwokR5oujiKRpyvo",
          label: "VH Bronx",
        },
        {
          id: 384,
          address: "885 Rogers Avenue, Brooklyn, NY 11226",
          google_place_id: null,
          label: "VH Brooklyn",
        },
      ],
      phone_numbers: [
        { id: 527, phone_number: "646-214-8164", label: null, address_id: 383 },
        { id: 528, phone_number: "929-551-2130", label: null, address_id: 384 },
      ],
      websites: [],
    });

    const result = await resourceApiClient.getOrganization(506);

    expect(result.addresses).toHaveLength(2);
    expect(result.addresses[0].googlePlaceId).toBe(
      "ChIJLb1Ag4DzwokR5oujiKRpyvo",
    );
    expect(result.addresses[1].googlePlaceId).toBeUndefined();
    expect(result.phoneNumbers).toHaveLength(2);
    expect(result.phoneNumbers[0].addressId).toBe(383);
  });

  test("reports and throws when the organization fails to parse", async () => {
    mockFetch({ id: 42, name: "Test Org" });

    await expect(resourceApiClient.getOrganization(42)).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not parse organization",
    });
    expect(captureException).toHaveBeenCalledTimes(1);
  });
});

describe("US_MA housing attributes", () => {
  const housingOrganization = {
    id: 9002,
    name: "Sample Street Women's Residence",
    attributes: {
      categorizations: [
        { section: "Housing", subsection: "Transitional Housing" },
      ],
      tags: ["Women", "Parolees Accepted"],
      county: "Worcester",
      category_attributes: {
        category: "Housing",
        weekly_rent: { min: 150, max: 200 },
        program_length_months: { min: 6, max: 12 },
        num_beds: 8,
      },
    },
    addresses: [],
    phone_numbers: [],
    websites: [],
  };
  const expectedAttributes = {
    county: "Worcester",
    categoryAttributes: {
      category: "Housing",
      weeklyRent: { min: 150, max: 200 },
      programLengthMonths: { min: 6, max: 12 },
      numBeds: 8,
    },
  };

  test("getOrganizations parses county and categoryAttributes", async () => {
    mockFetch([housingOrganization]);

    const [result] = await resourceApiClient.getOrganizations("US_MA");

    expect(result).toMatchObject(expectedAttributes);
  });

  test("getOrganization parses county and categoryAttributes", async () => {
    mockFetch(housingOrganization);

    const result = await resourceApiClient.getOrganization(9002);

    expect(result).toMatchObject(expectedAttributes);
  });

  test("coalesces null county and category attributes to undefined", async () => {
    mockFetch([
      {
        id: 1,
        name: "Test Org",
        attributes: {
          categorizations: [],
          tags: [],
          county: null,
          category_attributes: {
            category: "Housing",
            weekly_rent: null,
            rent_as_income_percent: null,
            program_length_months: null,
            num_beds: null,
          },
        },
      },
    ]);

    const [result] = await resourceApiClient.getOrganizations("US_MA");

    expect(result.county).toBeUndefined();
    expect(result.categoryAttributes).toEqual({ category: "Housing" });
  });

  test("drops and reports an organization with an unrecognized category, keeping the rest", async () => {
    mockFetch([
      {
        id: 1,
        name: "Test Org",
        attributes: {
          categorizations: [],
          tags: [],
          county: "Suffolk",
          category_attributes: { category: "Employment", hourly_wage: 20 },
        },
      },
      housingOrganization,
    ]);

    const result = await resourceApiClient.getOrganizations("US_MA");

    expect(result.map((org) => org.organizationId)).toEqual([9002]);
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  test("leaves county and categoryAttributes undefined for an NYC organization", async () => {
    mockFetch([
      {
        id: 1,
        name: "Test Org",
        attributes: {
          categorizations: [{ section: "Legal", subsection: "Public Defense" }],
          tags: [],
        },
      },
    ]);

    const [result] =
      await resourceApiClient.getOrganizations(US_NYC_STATE_CODE);

    expect(result.county).toBeUndefined();
    expect(result.categoryAttributes).toBeUndefined();
  });
});

describe("getOrganizations — unconfigured state", () => {
  test("throws NOT_FOUND for a state not in RESOURCES_CONFIG", async () => {
    await expect(
      resourceApiClient.getOrganizations("US_XX"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("request error handling", () => {
  test("throws TRPCError when RESOURCE_API_BASE_URL is not set", async () => {
    vi.stubEnv("RESOURCE_API_BASE_URL", "");

    await expect(
      resourceApiClient.getOrganizations(US_NYC_STATE_CODE),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });

  test("throws TRPCError when RESOURCE_API_KEY is not set", async () => {
    vi.stubEnv("RESOURCE_API_KEY", "");

    await expect(
      resourceApiClient.getOrganizations(US_NYC_STATE_CODE),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });

  test("throws TRPCError with the upstream status and body on its cause", async () => {
    const responseBody = '{"detail":"Service temporarily unavailable"}';
    const statusCode = 503;
    mockFetch(null, false, { status: statusCode, text: responseBody });

    await expect(
      resourceApiClient.getOrganizations(US_NYC_STATE_CODE),
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Resource API request failed",
      cause: expect.objectContaining({
        message: `${statusCode} — ${responseBody}`,
      }),
    });
  });
});
