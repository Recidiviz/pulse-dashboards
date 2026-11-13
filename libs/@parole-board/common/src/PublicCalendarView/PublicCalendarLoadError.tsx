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

import { StatusMessage } from "../components/StatusMessage";
import { PageFrame, useIsPhone } from "./PageFrame";
import { MessageArea } from "./PublicCalendarView.styles";

/**
 * The public calendar when its month fails to load: the header, and a
 * message in the grid's place. The app shell's SuspenseBoundary shows it
 * from renderError.
 */
export function PublicCalendarLoadError() {
  const phone = useIsPhone();
  return (
    <PageFrame phone={phone}>
      <MessageArea role="alert">
        <StatusMessage
          title="The calendar couldn't load."
          subtitle="Refresh the page to try again."
        />
      </MessageArea>
    </PageFrame>
  );
}
