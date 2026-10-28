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
import styled from "styled-components";

import { Button } from "~design-system";

import { semantics } from "../../theme";
import { Callout, CalloutLayout, CalloutTone } from "./Callout";

export default {};

const TONES: CalloutTone[] = ["info", "success", "warning", "error"];

const noop = () => {
  // intentionally empty for the static example
};

// Inline callouts shrink to their content, so they show their radius and
// padding next to the full-width strips.
const Stack = styled.div<{ $layout: CalloutLayout }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $layout }) =>
    $layout === "inline" ? "flex-start" : "stretch"};
  gap: ${semantics.space.md}px;
`;

const AllTones = ({ layout }: { layout: CalloutLayout }) => (
  <Stack $layout={layout}>
    {TONES.map((tone) => (
      <Callout key={tone} tone={tone} layout={layout} title={`${tone} tone`}>
        March 2027 has 12 hearings across 4 facilities.
      </Callout>
    ))}
  </Stack>
);

export const InlineTones = () => <AllTones layout="inline" />;

export const StripTones = () => <AllTones layout="strip" />;

export const WithAction = () => (
  <Callout
    tone="error"
    title="Couldn't add the month"
    action={<Button onClick={noop}>Try again</Button>}
  >
    The server didn&apos;t respond. Your changes weren&apos;t saved.
  </Callout>
);

export const WithActionAndDismiss = () => (
  <Callout
    tone="warning"
    action={<Button onClick={noop}>Review</Button>}
    onDismiss={noop}
  >
    Two hearings fall on Presidents Day.
  </Callout>
);

const DismissDemo = ({ layout }: { layout: CalloutLayout }) => {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return <Button onClick={() => setVisible(true)}>Show again</Button>;
  }
  return (
    <Callout tone="success" layout={layout} onDismiss={() => setVisible(false)}>
      April 2027 was added with 9 Board meetings.
    </Callout>
  );
};

export const Dismissible = () => <DismissDemo layout="inline" />;

export const DismissibleStrip = () => <DismissDemo layout="strip" />;

// The DRAFT strip after "Remove Published Month" on the Public Calendar
// screen.
export const DraftStrip = () => (
  <Callout
    tone="error"
    layout="strip"
    live={false}
    tag="Draft"
    title="September 2026 is back in draft and no longer live on the public calendar. Re-publish when your edits are complete."
  />
);

// The UPLOAD COMPLETE strip after publishing on the same screen.
export const UploadCompleteStrip = () => (
  <Callout
    tone="success"
    layout="strip"
    live={false}
    tag="Upload complete"
    detail="Published Oct 9, 2026 at 12:27 PM by editor@example.com"
    action={<Button onClick={noop}>View public page</Button>}
  >
    September 2026 is live on the public calendar — 17 hearing days, 315
    hearings.
  </Callout>
);
