// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { Icon, Sans16, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import formPreviewSrc from "../../../assets/static/images/compliantReportingFormPreview.png";
import { IconGoSvg } from "../../../components/Icons";
import { workflowsUrl } from "../../views";
import { ClientProfileProps } from "../types";
import { StatusPalette, Title, useStatusColors, Wrapper } from "./common";
import { CompliantReportingDenial } from "./CompliantReportingDenial";
import { CriteriaList } from "./CriteriaList";

const PreviewWrapper = styled(Wrapper)`
  border-width: 1px;
  column-gap: ${rem(spacing.xxl)};
  display: grid;
  grid-template-columns: 1fr auto;
  margin: ${rem(spacing.md)} 0;
`;

const LinkText = styled(Sans16)``;

const FormLink = styled(Link)<Pick<StatusPalette, "link">>`
  display: block;
  color: ${(props) => props.link};
  text-align: right;

  &:hover,
  &:focus {
    color: ${(props) => props.link};
    text-decoration: underline;
  }

  ${LinkText} {
    margin-bottom: ${rem(spacing.md)};
  }

  svg {
    margin-left: 0.5em;
    vertical-align: baseline;
  }
`;

const FormPreview = styled.img<Pick<StatusPalette, "border">>`
  border: 1px solid ${(props) => rgba(props.border, 0.2)};
  border-radius: ${rem(2)};
  display: block;
  filter: drop-shadow(
    ${rem(-60)} ${rem(10)} ${rem(40)} ${(props) => rgba(props.border, 0.3)}
  );
  height: auto;
  width: ${rem(205)};
`;

export const CompliantReportingPreview = observer(
  ({ client }: ClientProfileProps) => {
    if (!client.opportunities.compliantReporting) return null;

    const colors = useStatusColors(client);

    return (
      <PreviewWrapper {...colors}>
        <div>
          <Sans16>
            <Title client={client} />
          </Sans16>
          <CriteriaList
            opportunity={client.opportunities.compliantReporting}
            colors={colors}
          />
          <CompliantReportingDenial client={client} />
        </div>
        <div>
          <FormLink
            to={workflowsUrl("compliantReporting", {
              clientId: client.pseudonymizedId,
            })}
            link={colors.link}
            onClick={() =>
              client.trackProfileOpportunityClicked("compliantReporting")
            }
          >
            <LinkText>
              Auto-fill form
              <Icon kind={IconGoSvg} size={rem(14)} />
            </LinkText>
            <FormPreview src={formPreviewSrc} border={colors.border} />
          </FormLink>
        </div>
      </PreviewWrapper>
    );
  }
);
