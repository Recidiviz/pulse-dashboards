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

import { dbToAudioLevel, rmsToAudioLevel } from "./audioLevel";

describe("dbToAudioLevel", () => {
  it("returns 0 for any non-finite input", () => {
    expect(dbToAudioLevel(-Infinity)).toBe(0);
    expect(dbToAudioLevel(Infinity)).toBe(0);
    expect(dbToAudioLevel(NaN)).toBe(0);
  });

  it("returns 0 at the floor (-50 dB)", () => {
    expect(dbToAudioLevel(-50)).toBe(0);
  });

  it("returns 1 at the ceiling (-25 dB)", () => {
    expect(dbToAudioLevel(-25)).toBe(1);
  });

  it("applies gamma boost so the linear midpoint (-37.5 dB) exceeds 0.5", () => {
    // linear midpoint between -50 and -25 is -37.5 dB; gamma=0.4 lifts it above 0.5
    expect(dbToAudioLevel(-37.5)).toBeCloseTo(Math.pow(0.5, 0.4), 5);
    expect(dbToAudioLevel(-37.5)).toBeGreaterThan(0.5);
  });

  it("clamps to 0 below the floor", () => {
    expect(dbToAudioLevel(-80)).toBe(0);
    expect(dbToAudioLevel(-51)).toBe(0);
  });

  it("clamps to 1 above the ceiling", () => {
    expect(dbToAudioLevel(0)).toBe(1);
    expect(dbToAudioLevel(-24)).toBe(1);
  });
});

describe("rmsToAudioLevel", () => {
  it("returns 0 for zero amplitude (silence)", () => {
    expect(rmsToAudioLevel(0)).toBe(0);
  });

  it("returns 0 for negative amplitude", () => {
    expect(rmsToAudioLevel(-1)).toBe(0);
  });

  it("returns 0 for very quiet signals below the floor", () => {
    // rms=0.001 → ~-60 dBFS, below -50 dB floor
    expect(rmsToAudioLevel(0.001)).toBe(0);
  });

  it("returns 1 for full-scale amplitude", () => {
    // rms=1 → 0 dBFS, above -10 dB ceiling
    expect(rmsToAudioLevel(1)).toBe(1);
  });

  it("returns the same value as dbToAudioLevel for equivalent dB", () => {
    // rms=0.01 → 20*log10(0.01) = -40 dBFS, inside the -50 to -25 range
    expect(rmsToAudioLevel(0.01)).toBeCloseTo(dbToAudioLevel(-40), 10);
  });

  it("increases monotonically as amplitude grows", () => {
    const levels = [0.003, 0.01, 0.03, 0.1, 0.3, 1].map(rmsToAudioLevel);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
    }
  });
});
