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

import { Callout, type YearMonthOption } from "~@parole-board/common";

import { formatMonthYear, toYearMonthParam } from "../model/month";
import { NoticeGroup, NoticeHeading, NoticeList } from "./AddMonthModal.styles";

/** One created month's notices, in the words months.create returned. */
export type CreateNoticeGroup = YearMonthOption & { messages: string[] };

export type CreateNoticesProps = {
  /** The created months that have notices, in month order. */
  groups: CreateNoticeGroup[];
  onDismiss: () => void;
};

/**
 * The notices months.create returned for the months just added, such as a
 * meeting kind with no pattern, in one dismissible info Callout grouped under
 * "Notices for [Month Year]". The server doesn't store them, so the month
 * view shows them once, right after Add month navigates to it. The design
 * has no notice state; this follows the Callout's info tone.
 */
export function CreateNotices({ groups, onDismiss }: CreateNoticesProps) {
  if (groups.length === 0) return null;
  return (
    <Callout tone="info" onDismiss={onDismiss}>
      {groups.map((group) => (
        <NoticeGroup key={toYearMonthParam(group)}>
          <NoticeHeading>Notices for {formatMonthYear(group)}</NoticeHeading>
          <NoticeList>
            {group.messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </NoticeList>
        </NoticeGroup>
      ))}
    </Callout>
  );
}
