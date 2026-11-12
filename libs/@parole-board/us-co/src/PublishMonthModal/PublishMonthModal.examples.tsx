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

import { useState } from "react";
import { injectable, withDi } from "react-magnetic-di";
import ReactModal from "react-modal";

import {
  useCalendarConfig,
  useFetchMonth,
  usePublishMonth,
  usePublishPreview,
} from "~@parole-board/common";
import {
  calendarApiConfig,
  calendarApiError,
  failedQuery,
  mutationResult,
  publishPreview,
  queryResult,
  suspendedQuery,
} from "~@parole-board/common/fixtures";

import { PublishMonthModal } from "./PublishMonthModal";

const SEPTEMBER_2026 = { id: "month-2026-9", year: 2026, month: 9 };

// Typed as the hooks' own results, so the builders take the hooks' types.
const previewResult = (): ReturnType<typeof usePublishPreview> =>
  queryResult(publishPreview());
const publishResult = (): ReturnType<typeof usePublishMonth> =>
  mutationResult();

const useConfigDi = injectable(useCalendarConfig, () =>
  queryResult(calendarApiConfig),
);
// mutate logs to the actions panel and never settles, so nothing reads the
// month back.
const usePublishMonthDi = injectable(usePublishMonth, publishResult);
const useFetchMonthDi = injectable(
  useFetchMonth,
  () => () => new Promise<never>(() => undefined),
);
const previewDi = injectable(usePublishPreview, previewResult);
const loadingDi = injectable(usePublishPreview, suspendedQuery);
const loadErrorDi = injectable(usePublishPreview, () =>
  failedQuery(calendarApiError("INTERNAL_SERVER_ERROR", "Network error")),
);

const defaults = [useConfigDi, usePublishMonthDi, useFetchMonthDi];

/**
 * The dialog open on September 2026, reopening after Cancel or Escape so the
 * example stays usable.
 */
function OpenModal() {
  const [isOpen, setIsOpen] = useState(true);
  // The Modal opens on the first render, so the app element is set before
  // it rather than in an effect, which would run after it.
  useState(() =>
    ReactModal.setAppElement(
      document.getElementById("storybook-root") ?? document.body,
    ),
  );
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open the publish dialog</button>
      <PublishMonthModal
        isOpen={isOpen}
        month={SEPTEMBER_2026}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

const ReadyModal = withDi(OpenModal, [...defaults, previewDi]);
const LoadingModal = withDi(OpenModal, [...defaults, loadingDi]);
const LoadErrorModal = withDi(OpenModal, [...defaults, loadErrorDi]);

export default {};

// Each story renders its withDi component rather than exporting it, because
// Storybook reads the object withDi returns as a story object.

/** The dialog with September 2026's publish preview loaded. */
export const Ready = () => <ReadyModal />;

/** The skeleton while the publish preview loads. */
export const Loading = () => <LoadingModal />;

/** The retryable error when the publish preview fails to load. */
export const LoadError = () => <LoadErrorModal />;
