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

import { LSIR_SCORE_KEY } from "../../constants";
import { form } from "../FormStore";
import { isValidLsirScore } from "../utils";

describe("form input validation", () => {
  afterEach(() => form.resetErrors());

  it("should have no initial errors", () => {
    expect(form.hasError).toBe(false);
  });

  it("should have no errors when validating a form field with no required field or validator function", () => {
    const isValid = form.validate(LSIR_SCORE_KEY, "");
    expect(form.hasError).toBe(false);
    expect(isValid).toBe(true);
    expect(form.errors[LSIR_SCORE_KEY]).toBeUndefined();
    expect(form.errors[LSIR_SCORE_KEY]).toBeUndefined();
  });

  it("should error if field is required and there is no input (emptyRequiredField error)", () => {
    expect(form.hasError).toBe(false);

    let isValid = form.validate(LSIR_SCORE_KEY, "", true);
    expect(form.hasError).toBe(true);
    expect(isValid).toBe(false);
    expect(form.errors[LSIR_SCORE_KEY].emptyRequiredField).toBe(true);
    expect(form.errors[LSIR_SCORE_KEY].inputError).toBeUndefined();

    // Zeros are evaluated correctly
    isValid = form.validate(LSIR_SCORE_KEY, 0, true);
    expect(form.hasError).toBe(false);
    expect(isValid).toBe(true);
    expect(form.errors[LSIR_SCORE_KEY].emptyRequiredField).toBeUndefined();
    expect(form.errors[LSIR_SCORE_KEY].inputError).toBeUndefined();
  });

  it("should error if field fails its own validator function (inputError)", () => {
    expect(form.hasError).toBe(false);

    let isValid = form.validate(LSIR_SCORE_KEY, 0, true, isValidLsirScore);
    expect(form.hasError).toBe(false);
    expect(isValid).toBe(true);

    isValid = form.validate(LSIR_SCORE_KEY, 55, true, isValidLsirScore);
    expect(form.hasError).toBe(true);
    expect(isValid).toBe(false);
    expect(form.errors[LSIR_SCORE_KEY].emptyRequiredField).toBeUndefined();
    expect(form.errors[LSIR_SCORE_KEY].inputError).toBe(true);

    isValid = form.validate(LSIR_SCORE_KEY, "xyz", true, isValidLsirScore);
    expect(form.hasError).toBe(true);
    expect(isValid).toBe(false);
    expect(form.errors[LSIR_SCORE_KEY].emptyRequiredField).toBeUndefined();
    expect(form.errors[LSIR_SCORE_KEY].inputError).toBe(true);

    isValid = form.validate(LSIR_SCORE_KEY, "", true, isValidLsirScore);
    expect(form.hasError).toBe(true);
    expect(isValid).toBe(false);
    expect(form.errors[LSIR_SCORE_KEY].emptyRequiredField).toBe(true);
    expect(form.errors[LSIR_SCORE_KEY].inputError).toBeUndefined();
  });
});
