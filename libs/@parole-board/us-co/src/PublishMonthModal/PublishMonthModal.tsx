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

import { RefObject, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { todayIn } from "~@modules/Calendar/rules";
import type {
  MonthDetail,
  PbCalendarPublishedMetadata,
  PublishPreview,
} from "~@parole-board/common";
import {
  editorErrorMessage,
  getCalendarErrorCode,
  ModalActionRow,
  ParoleBoardButton,
  STALE_CALENDAR_CODES,
  useCalendarConfig,
  useFetchMonth,
  useParoleBoardHost,
  usePublishMonth,
  usePublishPreview,
  useRemovePublishPreview,
} from "~@parole-board/common";
import { LoadError, SuspenseBoundary } from "~@parole-board/common/loading";

import {
  daysBeforeMonthStart,
  formatMonthDay,
  formatMonthYear,
} from "../model/month";
import {
  PREVIEW_LOAD_ERROR_TITLE,
  PUBLISH_COPY,
  publishFailedMessage,
} from "./copy";
import { PublishMonthDialog } from "./PublishMonthDialog";
import { PublishMonthReview } from "./PublishMonthReview";
import { PublishMonthSkeleton } from "./PublishMonthSkeleton";

/** The toast's id, so a second publish replaces the first one's toast. */
const PUBLISHED_TOAST_ID = "pb-calendar-month-published";

type PublishFailure = {
  message: string;
  /** True when publishing again can't help, so the dialog offers only Close. */
  closeOnly: boolean;
};

/**
 * Builds the published event from the preview the editor confirmed. today
 * is the date in the calendar's timezone.
 */
function publishedMetadata(
  preview: PublishPreview,
  today: string,
): PbCalendarPublishedMetadata {
  return {
    year: preview.year,
    month: preview.month,
    hearingDays: preview.counts.entryDays,
    hearingCount: preview.counts.entryCount,
    holidayWarningCount: preview.holidayWarnings.length,
    isRepublish: preview.latestPublication !== null,
    daysBeforeMonthStart: daysBeforeMonthStart(preview, today),
  };
}

/**
 * Whether month shows a publication newer than the one preview saw, which
 * means a publish went through even though its response never arrived.
 */
function publishedSince(
  month: MonthDetail | null,
  preview: PublishPreview,
): boolean {
  const publication = month?.latestPublication;
  if (month?.status !== "PUBLISHED" || !publication) return false;
  const before = preview.latestPublication?.publishedAt.getTime();
  return before === undefined || publication.publishedAt.getTime() > before;
}

type PublishMonthBodyProps = {
  monthId: string;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
  submitting: boolean;
  failure: PublishFailure | null;
  dialogRef: RefObject<HTMLDivElement | null>;
  onCancel: () => void;
  onPublish: (preview: PublishPreview, timezone: string) => void;
};

/**
 * The dialog's body once the publish preview has loaded. It suspends until
 * then, so the SuspenseBoundary around it shows the skeleton.
 */
function PublishMonthBody({
  monthId,
  confirmed,
  onConfirmedChange,
  submitting,
  failure,
  dialogRef,
  onCancel,
  onPublish,
}: PublishMonthBodyProps) {
  const { data: preview } = usePublishPreview({ monthId });
  const { data: config } = useCalendarConfig();
  const removePreview = useRemovePublishPreview();

  // Each opening reviews a fresh preview, so it leaves the cache when the
  // body unmounts after the dialog closes.
  useEffect(() => () => removePreview(monthId), [removePreview, monthId]);

  // The preview refetches after a publish fails with CONFLICT. If the month
  // changed meanwhile, the editor hasn't reviewed what the button would now
  // publish, so the checkbox clears.
  const reviewedRevision = useRef(preview.revision);
  useEffect(() => {
    if (reviewedRevision.current === preview.revision) return;
    reviewedRevision.current = preview.revision;
    onConfirmedChange(false);
  }, [preview.revision, onConfirmedChange]);

  return (
    <PublishMonthReview
      counts={preview.counts}
      holidayWarnings={preview.holidayWarnings.map((warning) => ({
        id: warning.entryId,
        label: warning.label,
        dateLabel: formatMonthDay(warning.date),
        holidayName: warning.holidayName,
      }))}
      confirmed={confirmed}
      onConfirmedChange={onConfirmedChange}
      submitting={submitting}
      error={failure?.message}
      closeOnly={failure?.closeOnly}
      dialogRef={dialogRef}
      onCancel={onCancel}
      onPublish={() => onPublish(preview, config.calendar.timezone)}
    />
  );
}

export interface PublishMonthModalProps {
  isOpen: boolean;
  /** The month to publish, as months.get returns it. */
  month: Pick<MonthDetail, "id" | "year" | "month">;
  /** Called when the dialog closes, after a publish or without one. */
  onClose: () => void;
}

/**
 * The publish dialog: it loads the month's publish preview while the dialog is
 * open, publishes the revision the editor reviewed, and handles the
 * outcome.
 *
 * - Success closes the dialog at once, toasts and sends the published event.
 *   The publish mutation has already stored the month the server returned,
 *   and nothing refetches: a published month has no preview to read.
 * - The stale codes (STALE_CALENDAR_CODES) show the server's message. After
 *   CONFLICT (the month changed after the preview loaded) the refetched
 *   preview replaces the old one with the checkbox cleared.
 *   PRECONDITION_FAILED (the month is already published, for example from
 *   another tab) and NOT_FOUND offer only Close, since publishing again
 *   can't succeed.
 * - Any other failure, network errors included, first reads the month again:
 *   a publication newer than the preview's means the publish went through and
 *   only its response was lost, which counts as success. Otherwise it shows
 *   publishFailedMessage and keeps the checkbox, so the editor can retry.
 */
export function PublishMonthModal({
  isOpen,
  month,
  onClose,
}: PublishMonthModalProps) {
  const monthLabel = formatMonthYear(month);
  const { analyticsStore } = useParoleBoardHost();
  const publish = usePublishMonth();
  const fetchMonth = useFetchMonth();
  const [confirmed, setConfirmed] = useState(false);
  const [failure, setFailure] = useState<PublishFailure | null>(null);
  const [checkingOutcome, setCheckingOutcome] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const submitting = publish.isPending || checkingOutcome;

  const close = () => {
    setConfirmed(false);
    setFailure(null);
    publish.reset();
    onClose();
  };

  const onPublish = (preview: PublishPreview, timezone: string) => {
    setFailure(null);
    const sentAt = Date.now();
    const succeed = () => {
      analyticsStore.trackPbPublicCalendarMonthPublished(
        publishedMetadata(preview, todayIn(timezone)),
      );
      toast(PUBLISH_COPY.published(monthLabel), {
        id: PUBLISHED_TOAST_ID,
      });
      close();
    };
    const checkLostResponse = async () => {
      setCheckingOutcome(true);
      // The failed publish has already refetched the open month, so a month
      // read since the publish was sent isn't read again.
      const wentThrough = await fetchMonth(month, sentAt).then(
        (latest) => publishedSince(latest, preview),
        () => false,
      );
      setCheckingOutcome(false);
      if (wentThrough) succeed();
      else
        setFailure({
          message: publishFailedMessage(monthLabel),
          closeOnly: false,
        });
    };

    publish.mutate(
      { monthId: preview.monthId, expectedRevision: preview.revision },
      {
        onSuccess: succeed,
        onError: (error) => {
          const code = getCalendarErrorCode(error);
          if (!code || !STALE_CALENDAR_CODES.has(code)) {
            void checkLostResponse();
            return;
          }
          const conflict = code === "CONFLICT";
          if (conflict) setConfirmed(false);
          setFailure({
            message: editorErrorMessage(
              error,
              publishFailedMessage(monthLabel),
            ),
            closeOnly: !conflict,
          });
        },
      },
    );
  };

  return (
    <PublishMonthDialog
      isOpen={isOpen}
      monthLabel={monthLabel}
      onClose={close}
      submitting={submitting}
      dialogRef={dialogRef}
    >
      <SuspenseBoundary
        fallback={<PublishMonthSkeleton onCancel={close} />}
        renderError={(_, retry) => (
          <>
            <LoadError title={PREVIEW_LOAD_ERROR_TITLE} onRetry={retry} />
            <ModalActionRow>
              <ParoleBoardButton kind="secondary" onClick={close}>
                Cancel
              </ParoleBoardButton>
            </ModalActionRow>
          </>
        )}
      >
        <PublishMonthBody
          monthId={month.id}
          confirmed={confirmed}
          onConfirmedChange={setConfirmed}
          submitting={submitting}
          failure={failure}
          dialogRef={dialogRef}
          onCancel={close}
          onPublish={onPublish}
        />
      </SuspenseBoundary>
    </PublishMonthDialog>
  );
}
