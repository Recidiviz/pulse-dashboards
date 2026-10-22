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

import { RECORD_EVENT_TYPES, SnapshotDataRecord } from "~shared-pathways";

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

const { ADMISSION, RELEASE } = RECORD_EVENT_TYPES;

const individuals = "incarcerated_individual";
const parolees = "incarcerated_parolee";

const STATUS_LABELS: Record<string, string> = {
  [individuals]: "Incarcerated Individual",
  [parolees]: "Incarcerated Parolee",
};
const labelForStatus = (status: string) => STATUS_LABELS[status] ?? status;

const allRecords = [
  record(RELEASE, parolees, 30),
  record(ADMISSION, individuals, 100),
  record(RELEASE, individuals, 120),
  record(ADMISSION, parolees, 20),
];

const labelsOf = (bars: ReturnType<typeof buildCustodyStatusBars>) =>
  bars.map((bar) => bar.point.accessorLabel);

describe("buildCustodyStatusBars", () => {
  it("returns no bars for no records", () => {
    expect(buildCustodyStatusBars([], EVENT_TYPES.ALL, labelForStatus)).toEqual(
      [],
    );
  });

  it("draws both event types per status, admissions first", () => {
    expect(
      labelsOf(
        buildCustodyStatusBars(allRecords, EVENT_TYPES.ALL, labelForStatus),
      ),
    ).toEqual([
      "Incarcerated Individual — Admissions",
      "Incarcerated Individual — Releases",
      "Incarcerated Parolee — Admissions",
      "Incarcerated Parolee — Releases",
    ]);
  });

  it("colors each bar by the event type it counts", () => {
    const bars = buildCustodyStatusBars(
      allRecords,
      EVENT_TYPES.ALL,
      labelForStatus,
    );

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
        record(ADMISSION, individuals, 5),
        record(RELEASE, individuals, 5),
        record(ADMISSION, parolees, 40),
        record(RELEASE, parolees, 40),
      ],
      EVENT_TYPES.ALL,
      labelForStatus,
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
      labelsOf(
        buildCustodyStatusBars(
          allRecords,
          EVENT_TYPES.RELEASES,
          labelForStatus,
        ),
      ),
    ).toEqual(["Incarcerated Individual", "Incarcerated Parolee"]);
  });

  it("counts only the event type in view", () => {
    const bars = buildCustodyStatusBars(
      allRecords,
      EVENT_TYPES.ADMISSIONS,
      labelForStatus,
    );

    expect(bars.map((bar) => bar.point.value)).toEqual(["100", "20"]);
    expect(bars.every((bar) => bar.point.barColor === ADMISSIONS_COLOR)).toBe(
      true,
    );
  });

  it("numbers the bars so each one indexes its own record", () => {
    const bars = buildCustodyStatusBars(
      allRecords,
      EVENT_TYPES.ALL,
      labelForStatus,
    );

    bars.forEach((bar, index) => {
      expect(bar.point.index).toBe(index);
      expect(bar.point.value).toBe(String(bar.record.count));
    });
  });

  it("matches records by the API's event type, not the selector's", () => {
    const bars = buildCustodyStatusBars(
      [record(EVENT_TYPES.ADMISSIONS, individuals, 100)],
      EVENT_TYPES.ADMISSIONS,
      labelForStatus,
    );

    expect(bars).toEqual([]);
  });

  it("leaves out a record with no custody status", () => {
    const bars = buildCustodyStatusBars(
      [
        record(ADMISSION, individuals, 100),
        { eventType: ADMISSION, count: 5 } as SnapshotDataRecord,
      ],
      EVENT_TYPES.ADMISSIONS,
      labelForStatus,
    );

    expect(bars).toHaveLength(1);
  });
});
