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

import { typography } from "@recidiviz/design-system";
import Markdown from "markdown-to-jsx";
import { rem, rgba } from "polished";
import { FC } from "react";
import styled from "styled-components";

import { palette, spacing } from "~design-system";

import { ButtonLink } from "../Buttons/ButtonLink";

const Wrapper = styled.div`
  ${typography.Sans14}
  border-left: ${rem(4)} solid ${palette.signal.notification};
  background: ${rgba(palette.signal.notification, 0.1)};
  margin: ${rem(spacing.xl)} 0;
  padding: ${rem(spacing.md)};
  display: flex;
  gap: ${rem(spacing.xl)};
  align-items: center;
`;

const Message = styled.div`
  flex: 1 1 auto;
`;

const ActionLink = styled(ButtonLink)`
  flex: 0 0 auto;
`;

type AnnouncementBannerProps = {
  /** Markdown-formatted announcement copy */
  message: string;
  linkText: string;
  to: string;
};

/**
 * A highlighted, non-dismissible callout for announcing a policy change,
 * with a link out to more information about it.
 */
export const AnnouncementBanner: FC<AnnouncementBannerProps> = ({
  message,
  linkText,
  to,
}) => (
  <Wrapper>
    <Message>
      <Markdown>{message}</Markdown>
    </Message>
    <ActionLink kind="primary" to={to}>
      {linkText}
    </ActionLink>
  </Wrapper>
);
