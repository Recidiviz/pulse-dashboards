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

import { Button, Icon } from "~design-system";

import { StatusMessage } from "./StatusMessage";

const noop = () => {
  // intentionally empty for the static example
};

export default {};

export const TitleOnly = () => (
  <StatusMessage title="The Public Calendar isn't set up in this environment." />
);

export const WithSubtitleAndAction = () => (
  <StatusMessage
    title="The calendar couldn't load."
    subtitle="Check your connection and try again."
  >
    <Button onClick={noop}>Try again</Button>
  </StatusMessage>
);

export const WithIcon = () => (
  <StatusMessage
    icon={<Icon kind="Error" size={32} />}
    title="The calendar couldn't load."
    subtitle="Check your connection and try again."
  />
);
