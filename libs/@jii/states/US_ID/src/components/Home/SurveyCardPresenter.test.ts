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

import { IntakeAssessmentPresenter } from "~@jii/case-planning";
import type { UserStore } from "~@jii/data";
import type { WorkflowsResidentRecord } from "~datatypes";
import type { FirebaseAuthClient } from "~firebase-auth";

import { SurveyCardPresenter } from "./SurveyCardPresenter";

vi.mock("~@jii/case-planning", () => ({
  IntakeAssessmentPresenter: vi.fn(),
}));

const mockCopy = {
  heading: "Status",
  survey: {
    chip: "Ready",
    value: "Reentry survey available",
    body: "survey body",
    linkText: "Get started",
  },
  noSurvey: {
    chip: "Not ready",
    value: "No surveys available",
    body: "no survey body",
  },
};

const mockIntakeAuth = {
  isAuthorized: false,
  hydrate: vi.fn(),
  hydrationState: { status: "needs hydration" as const },
};

beforeEach(() => {
  vi.mocked(IntakeAssessmentPresenter).mockImplementation(
    () => mockIntakeAuth as unknown as IntakeAssessmentPresenter,
  );
});

function makePresenter() {
  return new SurveyCardPresenter(
    // none of these actually get used by this class, they are just passed through
    // to the IntakeAssessmentPresenter that is also being mocked
    {} as WorkflowsResidentRecord,
    {} as FirebaseAuthClient,
    {} as UserStore,
    mockCopy,
  );
}

describe("when authorized", () => {
  beforeEach(() => {
    mockIntakeAuth.isAuthorized = true;
  });

  it("returns the heading", () => {
    expect(makePresenter().heading).toBe("Status");
  });

  it("returns the survey chip", () => {
    expect(makePresenter().chip).toBe("Ready");
  });

  it("returns green chipColor", () => {
    expect(makePresenter().chipColor).toBe("green");
  });

  it("returns the survey value", () => {
    expect(makePresenter().value).toBe("Reentry survey available");
  });

  it("returns the survey body", () => {
    expect(makePresenter().body).toBe("survey body");
  });

  it("returns the survey linkText", () => {
    expect(makePresenter().linkText).toBe("Get started");
  });
});

describe("when not authorized", () => {
  beforeEach(() => {
    mockIntakeAuth.isAuthorized = false;
  });

  it("returns the heading", () => {
    expect(makePresenter().heading).toBe("Status");
  });

  it("returns the noSurvey chip", () => {
    expect(makePresenter().chip).toBe("Not ready");
  });

  it("returns red chipColor", () => {
    expect(makePresenter().chipColor).toBe("red");
  });

  it("returns the noSurvey value", () => {
    expect(makePresenter().value).toBe("No surveys available");
  });

  it("returns the noSurvey body", () => {
    expect(makePresenter().body).toBe("no survey body");
  });

  it("returns undefined for linkText", () => {
    expect(makePresenter().linkText).toBeUndefined();
  });
});
