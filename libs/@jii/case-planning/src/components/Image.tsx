// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { FC } from "react";

import { ImageComponentProps } from "~@reentry/frontend-shared";

export const Image: FC<ImageComponentProps> = ({
  // excluding priority as it is not a valid img attribute and has no function in this app,
  // it is a NextJS-only thing
  priority,
  ...props
}) => {
  // props include a required alt attribute
  // eslint-disable-next-line jsx-a11y/alt-text
  return <img {...props} />;
};
