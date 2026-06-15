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

import { StatusMessage } from "./StatusMessage";

// Required by Storybook's CSF indexer. Title is auto-derived from the file path.
export default {};

const Icon = ({ children }: { children: string }) => (
  <div
    style={{
      width: 48,
      height: 48,
      borderRadius: 24,
      background: "#e8eef5",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 24,
    }}
    aria-hidden
  >
    {children}
  </div>
);

export const TitleOnly = () => (
  <StatusMessage icon={<Icon>i</Icon>} title="Nothing to show yet">
    {null}
  </StatusMessage>
);

export const WithSubtitle = () => (
  <StatusMessage
    icon={<Icon>!</Icon>}
    title="No results found"
    subtitle="Try adjusting your filters to see more results."
  >
    {null}
  </StatusMessage>
);

export const WithActions = () => (
  <StatusMessage
    icon={<Icon>!</Icon>}
    title="Sorry, we’re having trouble loading this page"
    subtitle="Try reloading the page. If that doesn’t work, log out and log back in."
  >
    <button type="button">Reload</button>
    <button type="button">Log out</button>
  </StatusMessage>
);

export const SubtitleAsElement = () => (
  <StatusMessage
    icon={<Icon>?</Icon>}
    title="Need help?"
    subtitle={
      <>
        Reach us at{" "}
        <a href="mailto:feedback@recidiviz.org">feedback@recidiviz.org</a>.
      </>
    }
  >
    {null}
  </StatusMessage>
);
