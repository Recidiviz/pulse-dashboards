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

import { describe, expect, test } from "vitest";

import { type AgencyConfig, AgencyConfigSchema } from "~@meetings/config";
import { assignModels } from "~@meetings/tasks/llm/modelAssignment";

const agencyWith = (
  modelExperiment: AgencyConfig["modelExperiment"],
): AgencyConfig =>
  AgencyConfigSchema.parse({
    name: "Test Agency",
    stateCode: "US_XX",
    labels: {},
    modelExperiment,
  });

const lunaExperiment = (treatmentPercent: number) => ({
  id: "luna-rollout",
  treatmentPercent,
  models: { drafting: "gpt-6-luna" as const },
});

const staffEmails = Array.from(
  { length: 1000 },
  (_, i) => `staff${i}@example.gov`,
);

describe("assignModels", () => {
  test("leaves the agency unchanged when no experiment is set", () => {
    const agency = agencyWith(null);
    expect(assignModels(agency, "staff0@example.gov")).toEqual({ agency });
  });

  test("splits staff close to the percent and keeps each one in their group", () => {
    const agency = agencyWith(lunaExperiment(50));
    const variants = staffEmails.map(
      (staffEmail) => assignModels(agency, staffEmail).variant,
    );
    const treatmentShare =
      variants.filter((v) => v === "treatment").length / variants.length;
    expect(treatmentShare).toBeGreaterThan(0.45);
    expect(treatmentShare).toBeLessThan(0.55);

    const treated = assignModels(
      agency,
      staffEmails[variants.indexOf("treatment")].toUpperCase(),
    );
    expect(treated).toMatchObject({
      agency: {
        models: {
          extraction: "gpt-5-mini",
          drafting: "gpt-6-luna",
        },
      },
      experimentId: "luna-rollout",
      variant: "treatment",
    });
    expect(
      assignModels(agency, staffEmails[variants.indexOf("control")]).agency,
    ).toBe(agency);
  });

  test("raising the percent keeps everyone already in the treatment", () => {
    const at = (percent: number) =>
      staffEmails.map(
        (staffEmail) =>
          assignModels(agencyWith(lunaExperiment(percent)), staffEmail).variant,
      );
    const before = at(50);
    const after = at(80);
    before.forEach((variant, i) => {
      if (variant === "treatment") expect(after[i]).toBe("treatment");
    });
  });
});
