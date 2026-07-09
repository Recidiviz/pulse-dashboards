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

import * as Sentry from "@sentry/react-native";

type UploadOutcome = "completed" | "interrupted" | "failed";

/**
 * Attach upload metrics to the active `audio.upload` transaction
 */
export function recordUploadMetrics(
  span: Sentry.Span,
  metrics: {
    durationMs: number;
    totalBytes: number;
    bytesTransferred: number;
    networkType?: string;
    outcome: UploadOutcome;
  },
) {
  const throughputBytesPerSecond =
    metrics.durationMs > 0
      ? Math.round((metrics.bytesTransferred / metrics.durationMs) * 1000)
      : 0;

  Sentry.setMeasurement(
    "upload.duration",
    metrics.durationMs,
    "millisecond",
    span,
  );
  Sentry.setMeasurement("upload.bytes", metrics.totalBytes, "byte", span);
  Sentry.setMeasurement(
    "upload.bytes_transferred",
    metrics.bytesTransferred,
    "byte",
    span,
  );
  Sentry.setMeasurement(
    "upload.throughput",
    throughputBytesPerSecond,
    "byte/second",
    span,
  );

  span.setAttribute("upload.outcome", metrics.outcome);
  if (metrics.networkType) {
    span.setAttribute("network.type", metrics.networkType);
  }
}
