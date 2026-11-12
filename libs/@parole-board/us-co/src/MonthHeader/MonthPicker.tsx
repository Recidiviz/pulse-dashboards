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

import { useDeferredValue, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactSelect from "react-select";

import type { YearMonthOption } from "~@parole-board/common";
import { useMonthsList } from "~@parole-board/common";

import {
  monthOptionLabel,
  monthOptions,
  toYearMonthParam,
} from "../model/month";
import { MONTH_PICKER_CLASS, MonthPickerFrame } from "./MonthHeader.styles";

type MonthOption = { value: string; label: string; ym: YearMonthOption };

function toOption(ym: YearMonthOption, current: YearMonthOption): MonthOption {
  return {
    value: toYearMonthParam(ym),
    label: monthOptionLabel(ym, current),
    ym,
  };
}

/**
 * The month dropdown in the header. It lists the stored months a page at a
 * time from months.list, starting with the page centred on the current month,
 * and loads later and earlier pages as the menu scrolls to either end. Typed
 * text searches on the server, which reads a year and a month from it, so
 * react-select's own filter is off. The viewed month is always an option,
 * even when it isn't stored, so the control can show it. The menu opens with
 * the keyboard on the viewed month, react-select's selected option, which is
 * the current month on landing.
 *
 * Choosing a month navigates to it, since a select can't be a link. The path
 * is relative to the month's route, as MonthLink's is, and the query string
 * stays, so the staff app's tenantId does too.
 */
export function MonthPicker({
  viewed,
  current,
}: {
  viewed: YearMonthOption;
  current: YearMonthOption;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [inputValue, setInputValue] = useState("");
  // A new search suspends; the deferred value keeps the last results on
  // screen until the new ones arrive.
  const search = useDeferredValue(inputValue.trim());
  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
  } = useMonthsList({ around: current, search: search || undefined });

  const options = monthOptions(data.pages, search ? null : viewed).map((ym) =>
    toOption(ym, current),
  );
  // The selected option must be the same object as its entry in options, or
  // react-select opens the menu at the top instead of on it.
  const viewedValue = toYearMonthParam(viewed);
  const selected =
    options.find((option) => option.value === viewedValue) ??
    toOption(viewed, current);

  return (
    <MonthPickerFrame>
      <ReactSelect<MonthOption>
        aria-label="Month"
        // react-select turns scroll capture off on touch-capable browsers,
        // and onMenuScrollToTop and onMenuScrollToBottom only fire with it.
        captureMenuScroll
        classNamePrefix={MONTH_PICKER_CLASS}
        filterOption={null}
        inputValue={inputValue}
        isClearable={false}
        noOptionsMessage={() => "No months match"}
        onChange={(option) => {
          if (option) {
            navigate({
              pathname: `../${option.value}`,
              search: location.search,
            });
          }
        }}
        onInputChange={(value, { action }) => {
          if (action === "input-change") setInputValue(value);
          if (action === "menu-close" || action === "set-value") {
            setInputValue("");
          }
        }}
        onMenuScrollToBottom={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        onMenuScrollToTop={() => {
          if (hasPreviousPage && !isFetchingPreviousPage) {
            void fetchPreviousPage();
          }
        }}
        options={options}
        value={selected}
      />
    </MonthPickerFrame>
  );
}
