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

import { rem } from "polished";
import styled from "styled-components";

import { semantics } from "../../theme";
import { Badge, BadgeTone, badgeTones } from "./Badge";

const { space, surface } = semantics;

const tones = Object.keys(badgeTones) as BadgeTone[];

const Row = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${rem(space.md)};
  padding: ${rem(space.md)};
  background-color: ${surface.bg};
`;

export default {};

export const AllTonesMedium = () => (
  <Row>
    {tones.map((tone) => (
      <Badge key={tone} tone={tone}>
        {tone}
      </Badge>
    ))}
  </Row>
);

export const AllTonesSmall = () => (
  <Row>
    {tones.map((tone) => (
      <Badge key={tone} tone={tone} size="sm">
        {tone}
      </Badge>
    ))}
  </Row>
);

// The tags in the Calendar Unit Dashboard design: DRAFT and UPLOAD COMPLETE
// on the Public Calendar strips, and VICTIM ATTENDING in the Hearing
// Schedule's selected case panel.
export const DraftTag = () => (
  <Row>
    <Badge tone="neutral">Draft</Badge>
  </Row>
);

export const UploadCompleteTag = () => (
  <Row>
    <Badge tone="success">Upload complete</Badge>
  </Row>
);

export const VictimAttendingTag = () => (
  <Row>
    <Badge tone="error" size="sm">
      Victim attending
    </Badge>
  </Row>
);

export const NotUppercase = () => (
  <Row>
    <Badge tone="info" uppercase={false}>
      Holiday
    </Badge>
    <Badge tone="info" uppercase={false} size="sm">
      Holiday
    </Badge>
  </Row>
);
