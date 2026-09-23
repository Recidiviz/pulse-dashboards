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

/** Deep links to the places a meeting's errors actually live. */

const SENTRY_ORG = "recidiviz-inc";
const SENTRY_PROJECT = "meetings-server";
const CLOUD_RUN_SERVICE = "meetings-server";

/** The dashboard's configuration name maps to a GCP project. */
export function gcpProjectForConfiguration(
  configuration: string,
): string | undefined {
  if (configuration === "production") return "recidiviz-dashboard-production";
  if (configuration === "staging") return "recidiviz-dashboard-staging";
  return undefined;
}

/**
 * Issue search on the `meetingId` tag, which the pipeline routes set on their
 * Sentry scope. Note this only finds errors raised after the tag actually began
 * reaching Sentry — events captured by the Fastify error handler alone are
 * untagged and won't appear.
 */
export function sentryIssueSearchUrl(meetingId: string): string {
  const query = new URLSearchParams({
    project: SENTRY_PROJECT,
    query: `meetingId:${meetingId}`,
    statsPeriod: "90d",
  });
  return `https://${SENTRY_ORG}.sentry.io/issues/?${query}`;
}

/** Deep link to a GCS object in the console (uses the viewer's browser credentials). */
export function gcsObjectUrl(bucket: string, path: string): string {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `https://console.cloud.google.com/storage/browser/_details/${encodeURIComponent(bucket)}/${encodedPath}`;
}

/**
 * Cloud Logging for the meetings-server Cloud Run service, windowed around the
 * meeting.
 *
 * The window matters: the stitching log lines (including ffmpeg's stderr, which
 * is the only place the real error detail lands) do not include the meeting id,
 * so there is nothing to filter on and the time range is what narrows it down.
 */
export function cloudLoggingUrl(options: {
  configuration: string;
  meetingId: string;
  startTime: Date;
  endTime: Date | null;
  windowMinutes?: number;
}): string | undefined {
  const { configuration, meetingId, startTime, endTime } = options;
  const project = gcpProjectForConfiguration(configuration);
  if (!project) {
    return undefined;
  }

  const windowMinutes = options.windowMinutes ?? 120;
  // Processing happens after the meeting ends, so anchor the window there.
  const anchor = endTime ?? startTime;
  const from = new Date(anchor.getTime() - 15 * 60_000);
  const to = new Date(anchor.getTime() + windowMinutes * 60_000);

  const query = [
    `resource.type="cloud_run_revision"`,
    `resource.labels.service_name="${CLOUD_RUN_SERVICE}"`,
    `-protoPayload.@type="type.googleapis.com/google.cloud.audit.AuditLog"`,
    // Left commented in the pasted query so it can be toggled on: it matches
    // only the zero-chunk error, which is the one message carrying the id.
    `-- to filter to this meeting: "${meetingId}"`,
  ].join("\n");

  const params = new URLSearchParams({ project });
  return (
    `https://console.cloud.google.com/logs/query;` +
    `query=${encodeURIComponent(query)};` +
    `timeRange=${encodeURIComponent(`${from.toISOString()}/${to.toISOString()}`)}` +
    `?${params}`
  );
}
