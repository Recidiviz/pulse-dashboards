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

import { destroyPdfSorterPool } from "~@idaho-th/trpc/pdfSorter/worker/pdfSorterPool";
import { segment } from "~@idaho-th/trpc/routes/common/segment";

/**
 * The server's onClose hook. Segment is flushed even when the pool teardown
 * throws, so a failed teardown cannot drop buffered analytics events.
 */
export async function releaseServerResources(): Promise<void> {
  try {
    await destroyPdfSorterPool();
  } finally {
    await segment.closeAndFlush();
  }
}
