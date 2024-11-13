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

  describe("GET api/:stateCode/workflows/templates", () => {
    beforeEach(async () => {
      vi.doMock("../../utils/getAppMetadata", () => {
        return {
          getAppMetadata: vi.fn().mockImplementation(() => {
            return {
              state_code: "US_ND",
            };
          }),
        };
      });
      vi.stubEnv("IS_OFFLINE", "true");
      vi.stubEnv("AUTH_ENV", "test");
      vi.resetModules();
      app = (await import("../../app.js")).app;
    });

    describe("when user state code does not match request", () => {
      beforeEach(async () => {
        vi.doMock("../../utils/getAppMetadata", () => {
          return {
            getAppMetadata: vi.fn().mockImplementation(() => {
              return {
                state_code: "US_MO",
              };
            }),
          };
        });
        vi.stubEnv("IS_OFFLINE", "false");
        vi.stubEnv("AUTH_ENV", "dev");
        vi.resetModules();
        app = (await import("../../app.js")).app;
      });

      it("fails when the user state code does not match request", async () => {
        const response = await request(app).get(
          "/api/US_ND/workflows/templates?filename=early_termination_template.docx",
        );
        expect(response.statusCode).toEqual(401);
        expect(response.text).toEqual(
          "User is not authorized for stateCode: US_ND",
        );
      });
    });

    it("succeeds when user state code matches the request", async () => {
      const response = await request(app).get(
        "/api/US_ND/workflows/templates?filename=early_termination_template.docx",
      );
      expect(response.statusCode).toEqual(200);
    });

    it("fails when missing the filename param", async () => {
      const response = await request(app).get(
        "/api/US_ND/workflows/templates?filename=",
      );
      expect(response.statusCode).toEqual(500);
      expect(response.body.status).toEqual(500);
      expect(response.body.errors).toEqual([
        "Failed to send file  for stateCode US_ND. Error: EISDIR, read",
      ]);
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
