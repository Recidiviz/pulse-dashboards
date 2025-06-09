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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { CSSProperties, memo } from "react";
import useMeasure from "react-use-measure";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { FullBleedContainer, PageContainer } from "../BaseLayout/BaseLayout";
import { CopyWrapper } from "../CopyWrapper/CopyWrapper";
import { useResidentsContext } from "../ResidentsHydrator/context";

const FooterWrapper = styled(FullBleedContainer).attrs({ as: "footer" })`
  background-color: ${palette.pine1};
  color: ${palette.white80};
  margin-top: ${rem(spacing.xxl)};
  padding: ${rem(spacing.lg)} 0;

  h2,
  p {
    ${typography.Sans12}

    margin: 0;
  }

  h2 {
    color: ${palette.white};
  }
`;

const FooterContents = styled(PageContainer)`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`;

export const Footer = memo(function Footer() {
  const {
    residentsStore: {
      config: {
        home: { footer },
      },
    },
  } = useResidentsContext();

  // use these to detect column wrapping and restyle text accordingly
  const [col1ref, { left: col1Left }] = useMeasure();
  const [col2ref, { left: col2Left }] = useMeasure();
  const col2Style: CSSProperties =
    col2Left > col1Left ? { textAlign: "right" } : {};

  return (
    <FooterWrapper>
      <FooterContents>
        <div ref={col1ref}>
          <h2>{footer.about.title}</h2>
          <CopyWrapper>{footer.about.body}</CopyWrapper>
        </div>
        <div ref={col2ref} style={col2Style}>
          <h2>{footer.contact.title}</h2>
          <CopyWrapper>{footer.contact.body}</CopyWrapper>
        </div>
      </FooterContents>
    </FooterWrapper>
  );
});
