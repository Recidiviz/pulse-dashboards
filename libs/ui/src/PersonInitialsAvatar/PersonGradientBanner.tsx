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

import Avatar from "boring-avatars";
import styled from "styled-components";

import { palette } from "~design-system";

import { formatAvatarText } from "./PersonInitialsAvatar";

const BannerElement = styled.div`
  overflow: hidden;
  position: relative;

  & svg {
    height: auto;
    left: 0;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 100%;
  }
`;

/**
 * A decorative band of the same marble gradient PersonInitialsAvatar draws for
 * this person. The square pattern scales to the band's width and is cropped to
 * its middle, so the caller must set a height.
 *
 * @param name - The person's name, seeded the same way as their avatar.
 * @param className - Sets the band's height, corners and other box styles.
 */
export function PersonGradientBanner({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <BannerElement className={className} aria-hidden="true">
      <Avatar
        variant="marble"
        name={formatAvatarText(name, true)}
        colors={palette.data.profileColorOrder}
        square
      />
    </BannerElement>
  );
}
