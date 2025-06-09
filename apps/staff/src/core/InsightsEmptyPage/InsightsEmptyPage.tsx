// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Icon, IconSVG, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { workflowsUrl } from "../views";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: ${rem(666)};
  margin-top: ${rem(108)} !important;
  margin: 0 auto;
  text-align: center;
`;

const HeaderText = styled.div<{
  isMobile: boolean;
}>`
  ${({ isMobile }) => (isMobile ? typography.Serif24 : typography.Serif34)}
  color: ${palette.pine2};
  margin-bottom: ${rem(spacing.md)};
`;

const CallToActionText = styled.div`
  ${typography.Sans14}
  color: ${palette.slate80};
  margin-bottom: ${rem(spacing.md)};
`;

const StyledLink = styled(Link)`
  color: ${palette.signal.links} !important;
  text-wrap: balance;
  border-bottom: 1px solid transparent;
  margin-top: ${rem(spacing.sm)};

  & svg {
    margin-left: ${rem(spacing.sm)};
  }
  &:hover {
    border-color: ${palette.signal.links};
  }
`;

type InsightsEmptyPageProps = {
  headerText: string;
  callToActionText?: string;
  link?: string;
  linkText?: string;
};

const InsightsEmptyPage: React.FC<InsightsEmptyPageProps> = ({
  headerText,
  callToActionText,
  link,
  linkText,
}) => {
  const rootStore = useRootStore();
  const { isMobile } = useIsMobile(true);

  const stateCode = rootStore?.currentTenantId ?? "";

  const defaultLink =
    stateCode === "US_CA" ? workflowsUrl("milestones") : workflowsUrl("home");

  const defaultLinkText =
    stateCode === "US_CA"
      ? "Investigate agent's client milestones"
      : "Investigate staff caseloads in Workflows";

  return (
    <Wrapper>
      <HeaderText isMobile={isMobile}>{headerText}</HeaderText>
      {callToActionText && (
        <CallToActionText>{callToActionText}</CallToActionText>
      )}
      <StyledLink to={link ?? defaultLink}>
        {linkText ?? defaultLinkText}
        <Icon kind={IconSVG.Arrow} width={14} />
      </StyledLink>
    </Wrapper>
  );
};

export default InsightsEmptyPage;
