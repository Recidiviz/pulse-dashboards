// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

const Sentry = require("@sentry/node");
const request = require("supertest");
const { server } = require("../../../server");
const { clearMemoryCache } = require("../../core/cacheManager");

const OLD_ENV = process.env;

jest.mock("@sentry/node", () => ({
  Handlers: {
    errorHandler: jest.fn(() => {
      return (error, _req, _res, next) => {
        next(error);
      };
    }),
    requestHandler: jest.fn(() => {
      return (error, _req, _res, next) => {
        next(error);
      };
    }),
  },
  init: () => {},
}));
jest.mock("express-jwt", () => {
  return () => {
    const jwt = (req, res, next) => {
      next();
    };
    jwt.unless = jest.fn().mockImplementation(() => (req, res, next) => {
      next();
    });
    return jwt;
  };
});
jest.mock("../../utils/getAppMetadata", () => {
  return {
    getAppMetadata: jest.fn().mockImplementation(() => {
      return {
        state_code: "US_MO",
        can_access_leadership_dashboard: true,
        routes: {
          system_prison: true,
          system_prisonToSupervision: false,
          system_supervision: false,
          system_supervisionToLiberty: true,
        },
      };
    }),
  };
});

describe("Server tests", () => {
  let app;

  beforeAll(() => {
    // Reduce noise in the test
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(async () => {
    await clearMemoryCache();
    jest.resetModules();
    jest.restoreAllMocks();
    server.close();
    process.env = OLD_ENV;
  });

  describe("GET api/:stateCode/newRevocations/:file", () => {
    beforeEach(() => {
      process.env = Object.assign(process.env, {
        IS_OFFLINE: "true",
        AUTH_ENV: "test",
      });
      jest.resetModules();
      app = require("../../app").app;
    });

    it("should respond with a 200 for a valid stateCode", function () {
      return request(app)
        .get("/api/US_MO/newRevocations/revocations_matrix_events_by_month")
        .then((response) => {
          expect(response.statusCode).toEqual(200);
          expect(response.body).toHaveProperty(
            "revocations_matrix_events_by_month"
          );
          expect(
            response.body.revocations_matrix_events_by_month
          ).toHaveProperty("flattenedValueMatrix");
          expect(
            response.body.revocations_matrix_events_by_month
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
          "/api/US_MO/newRevocations/revocations_matrix_events_by_month?metricPeriodMonths=42"
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
          "/api/US_MO/newRevocations/revocations_matrix_events_by_month?admissionType[0]=DOGWOOD"
        )
        .then((response) => {
          expect(response.statusCode).toEqual(400);
          expect(response.body).toEqual(expectedErrors);
        });
    });
  });

  describe("GET /api/:stateCode/refreshCache", () => {
    beforeEach(() => {
      process.env = Object.assign(process.env, {
        IS_OFFLINE: "false",
        AUTH_ENV: "test",
      });
      jest.resetModules();
      app = require("../../app").app;
      jest.mock("../../core/fetchMetrics", () => {
        return {
          default: jest.fn(() =>
            Promise.resolve({ file_1: "content_1", file_2: "content_2" })
          ),
        };
      });
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

    it("should respond with a 403 when cron job header is invalid for goals", () => {
      return request(app)
        .get("/api/US_ND/goals/refreshCache")
        .then((response) => {
          expect(response.statusCode).toEqual(403);
        });
    });

    it("should respond successfully when cron job header is valid for goals", () => {
      return request(app)
        .get("/api/US_ND/goals/refreshCache")
        .set("X-Appengine-Cron", "true")
        .then((response) => {
          expect(response.statusCode).toEqual(200);
        });
    });
  });

  describe("GET api/:stateCode/pathways/:file", () => {
    beforeEach(() => {
      process.env = Object.assign(process.env, {
        IS_OFFLINE: "false",
        AUTH_ENV: "test",
      });
      jest.resetModules();
      app = require("../../app").app;
      jest.mock("../../core/fetchMetrics", () => {
        return {
          default: jest.fn(() =>
            Promise.resolve({ file_1: "content_1", file_2: "content_2" })
          ),
        };
      });
    });

    it("succeeds when the user has permissions", async () => {
      const prisonResponse = await request(app).get(
        "/api/US_MO/pathways/prison_population_time_series"
      );
      expect(prisonResponse.statusCode).toEqual(200);

      const supervisionToLibertyResponse = await request(app).get(
        "/api/US_MO/pathways/supervision_to_liberty_count_by_month"
      );
      expect(supervisionToLibertyResponse.statusCode).toEqual(200);
    });

    it("fails when the user does not have permissions", async () => {
      const prisonToSupervisionResponse = await request(app).get(
        "/api/US_MO/pathways/prison_to_supervision_count_by_month"
      );
      expect(prisonToSupervisionResponse.statusCode).toEqual(403);

      const supervisionResponse = await request(app).get(
        "/api/US_MO/pathways/supervision_population_time_series"
      );
      expect(supervisionResponse.statusCode).toEqual(403);
    });
  });

  describe("GET api/:stateCode/workflows/templates", () => {
    beforeEach(() => {
      process.env = Object.assign(process.env, {
        IS_OFFLINE: "true",
        AUTH_ENV: "test",
      });
      jest.resetModules();
      jest.mock("../../utils/getAppMetadata", () => {
        return {
          getAppMetadata: jest.fn().mockImplementation(() => {
            return {
              state_code: "US_ND",
            };
          }),
        };
      });
      app = require("../../app").app;
    });

    describe("when user state code does not match request", () => {
      beforeEach(() => {
        process.env = Object.assign(process.env, {
          IS_OFFLINE: "false",
          AUTH_ENV: "dev",
        });
        jest.resetModules();

        jest.mock("../../utils/getAppMetadata", () => {
          return {
            getAppMetadata: jest.fn().mockImplementation(() => {
              return {
                state_code: "US_MO",
              };
            }),
          };
        });
        app = require("../../app").app;
      });
      it("fails when the user state code does not match request", async () => {
        const response = await request(app).get(
          "/api/US_ND/workflows/templates?filename=early_termination_template.docx"
        );
        expect(response.statusCode).toEqual(401);
        expect(response.text).toEqual(
          "User is not authorized for stateCode: US_ND"
        );
      });
    });

    it("succeeds when user state code matches the request", async () => {
      const response = await request(app).get(
        "/api/US_ND/workflows/templates?filename=early_termination_template.docx"
      );
      expect(response.statusCode).toEqual(200);
    });

    it("fails when missing the filename param", async () => {
      const response = await request(app).get(
        "/api/US_ND/workflows/templates?filename="
      );
      expect(response.statusCode).toEqual(500);
      expect(response.body.status).toEqual(500);
      expect(response.body.errors).toEqual([
        "Failed to send file  for stateCode US_ND. Error: EISDIR, read",
      ]);
    });
  });

  describe("When a route handler throws an error", () => {
    beforeEach(() => {
      process.env = Object.assign(process.env, {
        IS_OFFLINE: "false",
        AUTH_ENV: "test",
      });
      jest.resetModules();
      jest.unmock("express-jwt");
      app = require("../../app").app;
    });

    it("responds with a formatted error response", () => {
      return request(app)
        .get("/api/US_MO/newRevocations/revocations_matrix_events_by_month")
        .then((response) => {
          expect(response.statusCode).toEqual(500);
          expect(response.body.errors).toEqual([
            "Cannot read properties of undefined (reading 'flattenedValueMatrix')",
          ]);
          expect(response.body.status).toEqual(500);
          expect(Sentry.Handlers.errorHandler).toHaveBeenCalledTimes(1);
        });
    });
  });
});
