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

import Markdown from "markdown-to-jsx";
import { rem, rgba } from "polished";
import { FC } from "react";
import styled from "styled-components";

import { palette, spacing, typography } from "~design-system";

import { ButtonLink } from "../Buttons/ButtonLink";

const Wrapper = styled.div`
  border-left: ${rem(4)} solid ${palette.signal.notification};
  background: ${rgba(palette.signal.notification, 0.1)};
  margin: ${rem(spacing.xl)} 0;
  padding: ${rem(spacing.md)};
`;

const Heading = styled.h3`
  ${typography.Sans16}

  margin-top: 0;
  margin-bottom: ${rem(spacing.md)};
`;

const MessageWrapper = styled.div`
  ${typography.Sans14}

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
  message: string;
  heading?: string;
  linkText?: string;
  to?: string;
};

/**
 * A highlighted, non-dismissible callout for announcing a policy change,
 * optionally with a link out to more information about it.
 */
export const AnnouncementBanner: FC<AnnouncementBannerProps> = ({
  message,
  heading,
  linkText,
  to,
}) => (
  <Wrapper>
    {heading && <Heading>{heading}</Heading>}
    <MessageWrapper>
      <Message>
        <Markdown>{message}</Markdown>
      </Message>
      {linkText && to && (
        <ActionLink kind="primary" to={to}>
          {linkText}
        </ActionLink>
      )}
    </MessageWrapper>
  </Wrapper>
);
