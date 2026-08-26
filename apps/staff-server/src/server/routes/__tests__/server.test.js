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

import jwt from "express-jwt";
import request from "supertest";

import { server } from "../..";
import { clearCache } from "../../core/cacheManager";
import { getAppMetadata } from "../../utils/getAppMetadata";

vi.mock("express-jwt", () => ({
  // this gets called at import time so we need an implementation before the test starts
  default: vi.fn().mockImplementation(() => {
    const validator = (req, res, next) => {
      next();
    };
    validator.unless = vi.fn().mockImplementation(() => (req, res, next) => {
      next();
    });
    return validator;
  }),
}));
vi.mock("firebase-admin");
vi.mock("../../utils/getAppMetadata");

beforeEach(() => {
  // Reduce noise in the test
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);

  vi.mocked(jwt).mockImplementation(() => {
    const validator = (req, res, next) => {
      next();
    };
    validator.unless = vi.fn().mockImplementation(() => (req, res, next) => {
      next();
    });
    return validator;
  });

  vi.mocked(getAppMetadata).mockReturnValue({
    state_code: "US_MO",
    routes: {
      system_prison: true,
      system_prisonToSupervision: false,
      system_supervision: false,
      system_supervisionToLiberty: true,
    },
  });
});

describe("Server tests", () => {
  let app;

  afterAll(async () => {
    clearCache();
    server.close();
  });

  describe("GET api/:stateCode/newRevocations/:file", () => {
    beforeEach(async () => {
      vi.stubEnv("IS_OFFLINE", "true");
      vi.stubEnv("AUTH_ENV", "test");
      vi.resetModules();
      app = (await import("../../app.js")).app;
    });

    it("should respond with a 200 for a valid stateCode", function () {
      return request(app)
        .get("/api/US_MO/newRevocations/revocations_matrix_events_by_month")
        .then((response) => {
          expect(response.statusCode).toEqual(200);
          expect(response.body).toHaveProperty(
            "revocations_matrix_events_by_month",
          );
          expect(
            response.body.revocations_matrix_events_by_month,
          ).toHaveProperty("flattenedValueMatrix");
          expect(
            response.body.revocations_matrix_events_by_month,
          ).toHaveProperty("metadata");
        });
    });

    it("should respond with a 400 for an invalid stateCode", function () {
      return request(app)
        .get("/api/HI/newRevocations/revocations_matrix_events_by_month")
        .then((response) => {
          expect(response.statusCode).toEqual(400);

          const respError = JSON.parse(response.error.text);
          expect(respError.errors[0].value).toEqual("HI");
          expect(respError.errors[0].msg).toEqual("Invalid value");
        });
    });

    it("should respond with a 400 for a misformatted stateCode", function () {
      return request(app)
        .get("/api/us_ndd/newRevocations/revocations_matrix_events_by_month")
        .then((response) => {
          expect(response.statusCode).toEqual(400);

          const respError = JSON.parse(response.error.text);
          expect(respError.errors[0].value).toEqual("US_NDD");
          expect(respError.errors[0].msg).toEqual("Invalid value");
        });
    });

    it("should respond with a 400 for an invalid query param", function () {
      const expectedErrors = {
        errors: [
          {
            location: "query",
            msg: "Invalid value",
            param: "metricPeriodMonths",
            value: "42",
          },
        ],
        status: 400,
      };
      return request(app)
        .get(
          "/api/US_MO/newRevocations/revocations_matrix_events_by_month?metricPeriodMonths=42",
        )
        .then((response) => {
          expect(response.statusCode).toEqual(400);
          expect(response.body).toEqual(expectedErrors);
        });
    });

    it("should respond with a 400 for an invalid admission type query param", function () {
      const expectedErrors = {
        errors: [
          {
            location: "query",
            msg: "Invalid value",
            param: "admissionType",
            value: ["DOGWOOD"],
          },
        ],
        status: 400,
      };
      return request(app)
        .get(
          "/api/US_MO/newRevocations/revocations_matrix_events_by_month?admissionType[0]=DOGWOOD",
        )
        .then((response) => {
          expect(response.statusCode).toEqual(400);
          expect(response.body).toEqual(expectedErrors);
        });
    });
  });

  describe("GET /api/:stateCode/refreshCache", () => {
    beforeEach(async () => {
      vi.doMock("../../core/fetchMetrics", () => {
        return {
          fetchMetrics: vi.fn(() =>
            Promise.resolve({ file_1: "content_1", file_2: "content_2" }),
          ),
        };
      });
      vi.stubEnv("IS_OFFLINE", "false");
      vi.stubEnv("AUTH_ENV", "test");
      vi.resetModules();
      app = (await import("../../app.js")).app;
    });

    it("should respond with a 403 when cron job header is invalid for newRevocation", () => {
      return request(app)
        .get("/api/US_PA/newRevocation/refreshCache")
        .then((response) => {
          expect(response.statusCode).toEqual(403);
        });
    });

    it("should respond successfully when cron job header is valid for newRevocation", () => {
      return request(app)
        .get("/api/US_PA/newRevocation/refreshCache")
        .set("X-Appengine-Cron", "true")
        .then((response) => {
          expect(response.statusCode).toEqual(200);
        });
    });

    it("should respond with a 403 when cron job header is invalid for vitals", () => {
      return request(app)
        .get("/api/US_ND/vitals/refreshCache")
        .then((response) => {
          expect(response.statusCode).toEqual(403);
        });
    });

    it("should respond successfully when cron job header is valid for vitals", () => {
      return request(app)
        .get("/api/US_ND/vitals/refreshCache")
        .set("X-Appengine-Cron", "true")
        .then((response) => {
          expect(response.statusCode).toEqual(200);
        });
    });
  });

  describe("GET api/:stateCode/pathways/:file", () => {
    beforeEach(async () => {
      vi.doMock("../../core/fetchMetrics", () => {
        return {
          fetchMetrics: vi.fn(() =>
            Promise.resolve({ file_1: "content_1", file_2: "content_2" }),
          ),
        };
      });
      vi.stubEnv("IS_OFFLINE", "false");
      vi.stubEnv("AUTH_ENV", "test");
      vi.resetModules();
      app = (await import("../../app.js")).app;
    });

    it("succeeds when the user has permissions", async () => {
      const prisonResponse = await request(app).get(
        "/api/US_MO/pathways/prison_population_time_series",
      );
      expect(prisonResponse.statusCode).toEqual(200);

      const supervisionToLibertyResponse = await request(app).get(
        "/api/US_MO/pathways/supervision_to_liberty_count_by_month",
      );
      expect(supervisionToLibertyResponse.statusCode).toEqual(200);
    });

    it("fails when the user does not have permissions", async () => {
      const prisonToSupervisionResponse = await request(app).get(
        "/api/US_MO/pathways/prison_to_supervision_count_by_month",
      );
      expect(prisonToSupervisionResponse.statusCode).toEqual(403);

      const supervisionResponse = await request(app).get(
        "/api/US_MO/pathways/supervision_population_time_series",
      );
      expect(supervisionResponse.statusCode).toEqual(403);
    });
  });

  describe("When a route handler throws an error", () => {
    beforeEach(async () => {
      vi.doUnmock("express-jwt");
      vi.stubEnv("IS_OFFLINE", "false");
      vi.stubEnv("AUTH_ENV", "test");
      vi.resetModules();
      app = (await import("../../app.js")).app;
    });

    it("responds with a formatted error response", () => {
      return request(app)
        .get("/api/US_MO/newRevocations/revocations_matrix_events_by_month")
        .then((response) => {
          expect(response.statusCode).toEqual(500);
          expect(response.body.errors).toMatchInlineSnapshot(`
            [
              "Cannot read properties of undefined (reading 'then')",
            ]
          `);
          expect(response.body.status).toEqual(500);
          // TODO(https://github.com/Recidiviz/pulse-dashboards/issues/5784): Add a test to check that error is reported to Sentry
        });
    });
  });

  // These two mint endpoints are mounted under stateApiBaseRoute specifically
  // so validateStateCode() gates :stateCode before the handler ever runs.
  // See mintScopedKeyHandler.ts.
  // A prior describe block ("When a route handler throws an error") calls
  // vi.doUnmock("express-jwt") and never re-mocks it — harmless there since
  // it runs with AUTH_ENV=test, which skips checkJwt/validateStateCode
  // entirely (see app.js's `authEnv !== "test"` guard). These blocks need
  // AUTH_ENV=development so validateStateCode() actually runs, which means
  // they also need checkJwt mocked, so re-establish it explicitly rather
  // than relying on declaration order in this file.
  const mockCheckJwt = () =>
    vi.doMock("express-jwt", () => ({
      default: vi.fn().mockImplementation(() => {
        const validator = (req, res, next) => {
          next();
        };
        validator.unless = vi
          .fn()
          .mockImplementation(() => (req, res, next) => {
            next();
          });
        return validator;
      }),
    }));

  describe("POST /api/:stateCode/workflows/caseload-scoped-key", () => {
    beforeEach(async () => {
      mockCheckJwt();
      vi.stubEnv("IS_OFFLINE", "false");
      vi.stubEnv("AUTH_ENV", "development");
      vi.resetModules();
      app = (await import("../../app.js")).app;
    });

    it("returns 401 when :stateCode doesn't match the caller's own state_code", () => {
      return request(app)
        .post("/api/US_TN/workflows/caseload-scoped-key")
        .send({ system: "SUPERVISION" })
        .then((response) => {
          expect(response.statusCode).toEqual(401);
        });
    });

    it("returns 404 when the route is hit without a :stateCode segment", () => {
      return request(app)
        .post("/workflows/caseload-scoped-key")
        .send({ system: "SUPERVISION" })
        .then((response) => {
          expect(response.statusCode).toEqual(404);
        });
    });

    it("returns 403 when user requests INCARCERATION without workflowsFacilities permission", () => {
      vi.mocked(getAppMetadata).mockReturnValue({
        state_code: "US_MO",
        routes: {
          workflowsSupervision: true,
        },
      });
      return request(app)
        .post("/api/US_MO/workflows/caseload-scoped-key")
        .send({ system: "INCARCERATION" })
        .then((response) => {
          expect(response.statusCode).toEqual(403);
          expect(response.body.error).toContain(
            "not authorized to access system: INCARCERATION",
          );
        });
    });

    // ALL is not a permission — the workflows home page requests it whatever
    // systems a user has, so refusing it would break that page for every
    // single-system user. It is narrowed to what they may search instead.
    it("narrows ALL rather than refusing it when only one system is permitted", () => {
      vi.mocked(getAppMetadata).mockReturnValue({
        state_code: "US_MO",
        routes: {
          workflowsSupervision: true,
        },
      });
      return request(app)
        .post("/api/US_MO/workflows/caseload-scoped-key")
        .send({ system: "ALL" })
        .then((response) => {
          expect(response.statusCode).not.toEqual(403);
        });
    });

    it("returns 403 for ALL when no system is permitted at all", () => {
      vi.mocked(getAppMetadata).mockReturnValue({
        state_code: "US_MO",
        routes: {},
      });
      return request(app)
        .post("/api/US_MO/workflows/caseload-scoped-key")
        .send({ system: "ALL" })
        .then((response) => {
          expect(response.statusCode).toEqual(403);
          expect(response.body.error).toContain(
            "not authorized to access system: ALL",
          );
        });
    });

    // `tasks` implies supervision, mirroring WorkflowsStore.userAllowedSystems.
    it("accepts SUPERVISION when only the tasks route is permitted", () => {
      vi.mocked(getAppMetadata).mockReturnValue({
        state_code: "US_MO",
        routes: { tasks: true },
      });
      return request(app)
        .post("/api/US_MO/workflows/caseload-scoped-key")
        .send({ system: "SUPERVISION" })
        .then((response) => {
          expect(response.statusCode).not.toEqual(403);
        });
    });

    it("returns 403 when user requests SUPERVISION without workflowsSupervision or tasks permission", () => {
      vi.mocked(getAppMetadata).mockReturnValue({
        state_code: "US_MO",
        routes: {
          workflowsFacilities: true,
        },
      });
      return request(app)
        .post("/api/US_MO/workflows/caseload-scoped-key")
        .send({ system: "SUPERVISION" })
        .then((response) => {
          expect(response.statusCode).toEqual(403);
          expect(response.body.error).toContain(
            "not authorized to access system: SUPERVISION",
          );
        });
    });

    it("allows Recidiviz users to request any system", () => {
      vi.mocked(getAppMetadata).mockReturnValue({
        state_code: "recidiviz",
        routes: {},
      });
      // Note: This test will fail with 422 or 500 due to missing Firestore setup,
      // but it should NOT fail with 403, which is what we're testing
      return request(app)
        .post("/api/US_MO/workflows/caseload-scoped-key")
        .send({ system: "ALL" })
        .then((response) => {
          expect(response.statusCode).not.toEqual(403);
        });
    });
  });

  describe("POST /api/:stateCode/workflows/person-scoped-key", () => {
    beforeEach(async () => {
      mockCheckJwt();
      vi.stubEnv("IS_OFFLINE", "false");
      vi.stubEnv("AUTH_ENV", "development");
      vi.resetModules();
      app = (await import("../../app.js")).app;
    });

    it("returns 401 when :stateCode doesn't match the caller's own state_code", () => {
      return request(app)
        .post("/api/US_TN/workflows/person-scoped-key")
        .send({ system: "SUPERVISION" })
        .then((response) => {
          expect(response.statusCode).toEqual(401);
        });
    });

    it("returns 404 when the route is hit without a :stateCode segment", () => {
      return request(app)
        .post("/workflows/person-scoped-key")
        .send({ system: "SUPERVISION" })
        .then((response) => {
          expect(response.statusCode).toEqual(404);
        });
    });

    it("returns 403 when user requests INCARCERATION without workflowsFacilities permission", () => {
      vi.mocked(getAppMetadata).mockReturnValue({
        state_code: "US_MO",
        routes: {
          workflowsSupervision: true,
        },
      });
      return request(app)
        .post("/api/US_MO/workflows/person-scoped-key")
        .send({ system: "INCARCERATION" })
        .then((response) => {
          expect(response.statusCode).toEqual(403);
          expect(response.body.error).toContain(
            "not authorized to access system: INCARCERATION",
          );
        });
    });

    // Narrowed, not refused — same reasoning as the caseload endpoint above.
    it("narrows ALL rather than refusing it when only one system is permitted", () => {
      vi.mocked(getAppMetadata).mockReturnValue({
        state_code: "US_MO",
        routes: {
          workflowsSupervision: true,
        },
      });
      return request(app)
        .post("/api/US_MO/workflows/person-scoped-key")
        .send({ system: "ALL" })
        .then((response) => {
          expect(response.statusCode).not.toEqual(403);
        });
    });
  });

  describe("getImpersonatedUserRestrictions", () => {
    beforeEach(async () => {
      vi.stubEnv("IS_OFFLINE", "true");
      vi.stubEnv("AUTH_ENV", "test");
      vi.resetModules();
      app = (await import("../../app.js")).app;
    });

    it("responds with error in offline mode", () => {
      return request(app)
        .get(
          "/api/impersonateAuth0User?impersonatedstateCode=US_ID&impersonatedEmail=test@test.com",
        )
        .then((response) => {
          expect(response.statusCode).toEqual(500);
          expect(response.body.errors).toEqual([
            "Impersonate user is not available in offline mode",
          ]);
          expect(response.body.status).toEqual(500);
        });
    });
  });
});
