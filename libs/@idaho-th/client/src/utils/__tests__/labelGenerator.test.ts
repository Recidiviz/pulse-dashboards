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

import type { EligibilityParams } from "~@idaho-th/shared";

import { LABEL_STATE } from "../../constants/label";
import type { HousingProviderLocation } from "../../interfaces/common";
import {
  filterMatchLabels,
  generateLabels,
  getConflictFactors,
  hasRequirementConflicts,
  PROVIDER_LABELS,
} from "../labelGenerator";

const baseLocation: HousingProviderLocation = {
  id: "loc-1",
  district: "D1",
  acceptedGenders: ["MALE", "FEMALE"],
  acceptsRiders: true,
  acceptsSexOffenders: true,
  acceptsViolentCriminals: true,
  faithBased: true,
};

const baseParams: EligibilityParams = {
  preferredDistricts: [],
  preferredProviders: [],
  gender: "Male",
  isRider: false,
  isSexOffender: false,
  faithBasedPreferred: null,
};

describe("generateLabels", () => {
  it("marks district labels as error when the provider district is not preferred", () => {
    const labels = generateLabels(baseLocation, {
      ...baseParams,
      preferredDistricts: ["d2"],
    });

    const districtLabel = labels.find((label) => label.text === "D1");
    expect(districtLabel?.state).toBe(LABEL_STATE.error);
  });

  it("marks district labels as match when the provider district is preferred", () => {
    const labels = generateLabels(baseLocation, {
      ...baseParams,
      preferredDistricts: ["d1"],
    });

    const districtLabel = labels.find((label) => label.text === "D1");
    expect(districtLabel?.state).toBe(LABEL_STATE.match);
  });

  it("marks men-only providers as error for female applicants", () => {
    const menOnlyLocation: HousingProviderLocation = {
      ...baseLocation,
      acceptedGenders: ["MALE"],
    };

    const labels = generateLabels(menOnlyLocation, {
      ...baseParams,
      gender: "Female",
    });

    const genderLabel = labels.find(
      (label) => label.text === PROVIDER_LABELS.gender.menOnly,
    );
    expect(genderLabel?.state).toBe(LABEL_STATE.error);
  });

  it("marks women-only providers as error for male applicants", () => {
    const womenOnlyLocation: HousingProviderLocation = {
      ...baseLocation,
      acceptedGenders: ["FEMALE"],
    };

    const labels = generateLabels(womenOnlyLocation, {
      ...baseParams,
      gender: "Male",
    });

    const genderLabel = labels.find(
      (label) => label.text === PROVIDER_LABELS.gender.womenOnly,
    );
    expect(genderLabel?.state).toBe(LABEL_STATE.error);
  });

  it("adds a rider rejection label when the applicant is a rider and the provider does not accept riders", () => {
    const noRidersLocation: HousingProviderLocation = {
      ...baseLocation,
      acceptsRiders: false,
    };

    const labels = generateLabels(noRidersLocation, {
      ...baseParams,
      isRider: true,
    });

    expect(
      labels.some((label) => label.text === PROVIDER_LABELS.rider.rejects),
    ).toBe(true);
  });

  it("adds a faith-based label when faith-based preference is requested", () => {
    const labels = generateLabels(baseLocation, {
      ...baseParams,
      faithBasedPreferred: true,
    });

    expect(
      labels.some((label) => label.text === PROVIDER_LABELS.faithBased.yes),
    ).toBe(true);
  });

  it("marks men-only providers as warning when gender is unknown", () => {
    const menOnlyLocation: HousingProviderLocation = {
      ...baseLocation,
      acceptedGenders: ["MALE"],
    };

    const labels = generateLabels(menOnlyLocation, {
      ...baseParams,
      gender: "",
    });

    const genderLabel = labels.find(
      (label) => label.text === PROVIDER_LABELS.gender.menOnly,
    );
    expect(genderLabel?.state).toBe(LABEL_STATE.warning);
  });

  it("marks sex-offender restrictions as warning when applicant status is unknown", () => {
    const noSexOffendersLocation: HousingProviderLocation = {
      ...baseLocation,
      acceptsSexOffenders: false,
    };

    const labels = generateLabels(noSexOffendersLocation, {
      ...baseParams,
      isSexOffender: null,
    });

    const sexOffenderLabel = labels.find(
      (label) => label.text === PROVIDER_LABELS.sexOffender.rejects,
    );
    expect(sexOffenderLabel?.state).toBe(LABEL_STATE.warning);
  });

  it("marks non-faith-based providers as warning when faith-based is preferred", () => {
    const nonFaithLocation: HousingProviderLocation = {
      ...baseLocation,
      faithBased: false,
    };

    const labels = generateLabels(nonFaithLocation, {
      ...baseParams,
      faithBasedPreferred: true,
    });

    const faithLabel = labels.find(
      (label) => label.text === PROVIDER_LABELS.faithBased.no,
    );
    expect(faithLabel?.state).toBe(LABEL_STATE.warning);
  });

  it("omits sex-offender labels when status is unknown and the provider accepts sex offenders", () => {
    const labels = generateLabels(baseLocation, {
      ...baseParams,
      isSexOffender: null,
    });

    expect(
      labels.some(
        (label) => label.text === PROVIDER_LABELS.sexOffender.accepts,
      ),
    ).toBe(false);
    expect(
      labels.some(
        (label) => label.text === PROVIDER_LABELS.sexOffender.rejects,
      ),
    ).toBe(false);
  });

  it("omits faith-based labels when the client does not prefer faith-based providers", () => {
    const labels = generateLabels(baseLocation, {
      ...baseParams,
      faithBasedPreferred: false,
    });

    expect(
      labels.some((label) => label.text === PROVIDER_LABELS.faithBased.yes),
    ).toBe(false);
    expect(
      labels.some((label) => label.text === PROVIDER_LABELS.faithBased.no),
    ).toBe(false);
  });

  it("orders labels error, then warning, then match", () => {
    const location: HousingProviderLocation = {
      ...baseLocation,
      district: "D2",
      acceptedGenders: ["MALE"],
      acceptsSexOffenders: false,
      faithBased: true,
    };

    const labels = generateLabels(location, {
      ...baseParams,
      preferredDistricts: ["d1"],
      gender: "",
      isSexOffender: null,
      faithBasedPreferred: true,
    });

    const states = labels.map((label) => label.state);
    const firstWarning = states.indexOf(LABEL_STATE.warning);
    const firstMatch = states.indexOf(LABEL_STATE.match);
    const lastError = states.lastIndexOf(LABEL_STATE.error);

    expect(states).toContain(LABEL_STATE.error);
    expect(states).toContain(LABEL_STATE.warning);
    expect(states).toContain(LABEL_STATE.match);
    expect(lastError).toBeLessThan(firstWarning);
    expect(firstWarning).toBeLessThan(firstMatch);
  });

  it("omits rider labels when applicant flags are false", () => {
    const labels = generateLabels(baseLocation, {
      ...baseParams,
      isRider: false,
      isSexOffender: false,
    });

    expect(
      labels.some((label) => label.text === PROVIDER_LABELS.rider.accepts),
    ).toBe(false);
    expect(
      labels.some((label) => label.text === PROVIDER_LABELS.rider.rejects),
    ).toBe(false);
    expect(
      labels.some(
        (label) => label.text === PROVIDER_LABELS.sexOffender.accepts,
      ),
    ).toBe(false);
  });
});

describe("hasRequirementConflicts", () => {
  it("returns true when the applicant is a rider and the provider does not accept riders", () => {
    const noRidersLocation: HousingProviderLocation = {
      ...baseLocation,
      acceptsRiders: false,
    };

    expect(
      hasRequirementConflicts(noRidersLocation, {
        ...baseParams,
        isRider: true,
      }),
    ).toBe(true);
  });

  it("returns false when the applicant is not a rider and the provider accepts riders", () => {
    expect(
      hasRequirementConflicts(baseLocation, {
        ...baseParams,
        isRider: false,
      }),
    ).toBe(false);
  });

  it("returns false when the applicant is a sex offender and the provider accepts sex offenders", () => {
    expect(
      hasRequirementConflicts(baseLocation, {
        ...baseParams,
        isSexOffender: true,
      }),
    ).toBe(false);
  });

  it("returns false when no applicant requirement flags are set", () => {
    expect(hasRequirementConflicts(baseLocation, baseParams)).toBe(false);
  });

  it("returns true when multiple requirement conflicts exist simultaneously", () => {
    const restrictiveLocation: HousingProviderLocation = {
      ...baseLocation,
      acceptsRiders: false,
      acceptsSexOffenders: false,
    };

    expect(
      hasRequirementConflicts(restrictiveLocation, {
        ...baseParams,
        isRider: true,
        isSexOffender: true,
      }),
    ).toBe(true);
  });
});

describe("getConflictFactors", () => {
  const districtParams: EligibilityParams = {
    ...baseParams,
    preferredDistricts: ["D1"],
  };

  it("always includes gender and district", () => {
    expect(getConflictFactors(baseLocation, districtParams)).toEqual([
      "Male",
      "D1",
    ]);
  });

  it("joins multiple preferred districts with a comma", () => {
    const factors = getConflictFactors(baseLocation, {
      ...baseParams,
      preferredDistricts: ["D1", "D2"],
    });

    expect(factors).toEqual(["Male", "D1, D2"]);
  });

  it("adds Sex offender only when the applicant is a sex offender and the provider does not accept them", () => {
    const noSexOffendersLocation: HousingProviderLocation = {
      ...baseLocation,
      acceptsSexOffenders: false,
    };

    expect(
      getConflictFactors(noSexOffendersLocation, {
        ...districtParams,
        isSexOffender: true,
      }),
    ).toEqual(["Male", "D1", "Sex offender"]);

    expect(
      getConflictFactors(noSexOffendersLocation, {
        ...districtParams,
        isSexOffender: false,
      }),
    ).toEqual(["Male", "D1"]);
  });
});

describe("filterMatchLabels", () => {
  it("filters match labels for inline display", () => {
    const labels = generateLabels(baseLocation, baseParams);
    const matchLabels = filterMatchLabels(labels);

    expect(
      matchLabels.every((label) => label.state === LABEL_STATE.match),
    ).toBe(true);
    expect(
      matchLabels.some(
        (label) => label.text === PROVIDER_LABELS.gender.allGenders,
      ),
    ).toBe(true);
  });
});
