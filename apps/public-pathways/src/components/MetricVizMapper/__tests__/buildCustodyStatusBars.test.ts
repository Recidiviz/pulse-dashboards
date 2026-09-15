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

import { SnapshotDataRecord } from "~shared-pathways";

import {
  ADMISSIONS_COLOR,
  EVENT_TYPES,
  RELEASES_COLOR,
} from "../../../datastores/eventTypes";
import { buildCustodyStatusBars } from "../VizCustodyStatusSnapshot";

const record = (
  eventType: string,
  custodyStatus: string,
  count: number,
): SnapshotDataRecord =>
  ({ eventType, custodyStatus, count }) as unknown as SnapshotDataRecord;

const individuals = "Incarcerated Individual";
const parolees = "Incarcerated Parolee";

const allRecords = [
  record(EVENT_TYPES.RELEASES, parolees, 30),
  record(EVENT_TYPES.ADMISSIONS, individuals, 100),
  record(EVENT_TYPES.RELEASES, individuals, 120),
  record(EVENT_TYPES.ADMISSIONS, parolees, 20),
];

const labelsOf = (bars: ReturnType<typeof buildCustodyStatusBars>) =>
  bars.map((bar) => bar.point.accessorLabel);

describe("buildCustodyStatusBars", () => {
  it("returns no bars for no records", () => {
    expect(buildCustodyStatusBars([], EVENT_TYPES.ALL)).toEqual([]);
  });

  it("draws both event types per status, admissions first", () => {
    expect(
      labelsOf(buildCustodyStatusBars(allRecords, EVENT_TYPES.ALL)),
    ).toEqual([
      `${individuals} — Admissions`,
      `${individuals} — Releases`,
      `${parolees} — Admissions`,
      `${parolees} — Releases`,
    ]);
  });

  it("colors each bar by the event type it counts", () => {
    const bars = buildCustodyStatusBars(allRecords, EVENT_TYPES.ALL);

    expect(bars.map((bar) => bar.point.barColor)).toEqual([
      ADMISSIONS_COLOR,
      RELEASES_COLOR,
      ADMISSIONS_COLOR,
      RELEASES_COLOR,
    ]);
  });

  it("orders statuses by total count, largest first", () => {
    const bars = buildCustodyStatusBars(
      [
        record(EVENT_TYPES.ADMISSIONS, individuals, 5),
        record(EVENT_TYPES.RELEASES, individuals, 5),
        record(EVENT_TYPES.ADMISSIONS, parolees, 40),
        record(EVENT_TYPES.RELEASES, parolees, 40),
      ],
      EVENT_TYPES.ALL,
    );

    expect(bars.map((bar) => bar.point.accessorValue)).toEqual([
      parolees,
      parolees,
      individuals,
      individuals,
    ]);
  });

  it("drops the event type from the label for a single event type", () => {
    expect(
      labelsOf(buildCustodyStatusBars(allRecords, EVENT_TYPES.RELEASES)),
    ).toEqual([individuals, parolees]);
  });

  it("counts only the event type in view", () => {
    const bars = buildCustodyStatusBars(allRecords, EVENT_TYPES.ADMISSIONS);

    expect(bars.map((bar) => bar.point.value)).toEqual(["100", "20"]);
    expect(bars.every((bar) => bar.point.barColor === ADMISSIONS_COLOR)).toBe(
      true,
    );
  });

  it("numbers the bars so each one indexes its own record", () => {
    const bars = buildCustodyStatusBars(allRecords, EVENT_TYPES.ALL);

    bars.forEach((bar, index) => {
      expect(bar.point.index).toBe(index);
      expect(bar.point.value).toBe(String(bar.record.count));
    });
  });

  it("leaves out a record with no custody status", () => {
    const bars = buildCustodyStatusBars(
      [
        record(EVENT_TYPES.ADMISSIONS, individuals, 100),
        { eventType: EVENT_TYPES.ADMISSIONS, count: 5 } as SnapshotDataRecord,
      ],
      EVENT_TYPES.ADMISSIONS,
    );

    expect(bars).toHaveLength(1);
  });
});
