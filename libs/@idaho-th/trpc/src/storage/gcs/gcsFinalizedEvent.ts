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

export type GcsFinalizedEventPayload = {
  bucket: string;
  name: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function bucketAndNameFrom(
  value: Record<string, unknown>,
): GcsFinalizedEventPayload | undefined {
  const { bucket, name } = value;
  return typeof bucket === "string" && typeof name === "string"
    ? { bucket, name }
    : undefined;
}

/**
 * Eventarc delivers GCS object.finalized notifications as a CloudEvent, in
 * one of two content modes depending on how the trigger is configured:
 *  - structured mode: the whole envelope is JSON, with the GCS object
 *    resource under a top-level `data` key (`{ data: { bucket, name, ... } }`)
 *  - binary mode: the envelope (type/source/id/...) rides in `ce-*` headers
 *    and the HTTP body IS the GCS object resource directly
 * Returns undefined for anything that doesn't look like either shape, so
 * callers can fall back to treating the body as a direct (e.g. test) payload.
 */
export function parseGcsFinalizedEvent(
  headers: Record<string, string | string[] | undefined>,
  body: unknown,
): GcsFinalizedEventPayload | undefined {
  if (isRecord(body) && isRecord(body["data"])) {
    const structured = bucketAndNameFrom(body["data"]);
    if (structured) return structured;
  }

  const ceType = headers["ce-type"];
  if (typeof ceType === "string" && ceType.length > 0 && isRecord(body)) {
    const binary = bucketAndNameFrom(body);
    if (binary) return binary;
  }

  return undefined;
}
