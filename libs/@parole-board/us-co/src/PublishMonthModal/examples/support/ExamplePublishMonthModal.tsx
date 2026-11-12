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

import { useRef, useState } from "react";
import ReactModal from "react-modal";

import { PublishMonthDialog } from "../../PublishMonthDialog";
import { PublishMonthReview } from "../../PublishMonthReview";
import { PublishMonthSkeleton } from "../../PublishMonthSkeleton";
import { PublishHolidayWarning } from "../../PublishSummary";

// This file lives one folder below examples/ and isn't named *.examples.tsx,
// so the examples indexer doesn't read it as a story.

export const MONTH_LABEL = "September 2026";

/** The counts of the september2026 fixture's hearings: 13 days and 37 hearings. */
const SEPTEMBER_2026_COUNTS = { entryDays: 13, entryCount: 37 };

export type ExamplePublishMonthModalProps = {
  initialConfirmed?: boolean;
  holidayWarnings?: PublishHolidayWarning[];
  submitting?: boolean;
  error?: string;
  closeOnly?: boolean;
  /** Shows the skeleton in place of the review. */
  loading?: boolean;
};

/**
 * The publish dialog for September 2026, holding its own checkbox so each
 * example stays interactive.
 */
export function ExamplePublishMonthModal({
  initialConfirmed = false,
  holidayWarnings = [],
  submitting = false,
  error,
  closeOnly,
  loading = false,
}: ExamplePublishMonthModalProps) {
  const [confirmed, setConfirmed] = useState(initialConfirmed);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // The Modal opens on the first render, so the app element is set before
  // it rather than in an effect, which would run after it.
  useState(() =>
    ReactModal.setAppElement(
      document.getElementById("storybook-root") ?? document.body,
    ),
  );

  return (
    <PublishMonthDialog
      isOpen
      monthLabel={MONTH_LABEL}
      onClose={() => setConfirmed(false)}
      submitting={submitting}
      dialogRef={dialogRef}
    >
      {loading ? (
        <PublishMonthSkeleton onCancel={() => undefined} />
      ) : (
        <PublishMonthReview
          counts={SEPTEMBER_2026_COUNTS}
          holidayWarnings={holidayWarnings}
          confirmed={confirmed}
          onConfirmedChange={setConfirmed}
          submitting={submitting}
          error={error}
          closeOnly={closeOnly}
          dialogRef={dialogRef}
          onCancel={() => setConfirmed(false)}
          onPublish={() => undefined}
        />
      )}
    </PublishMonthDialog>
  );
}
