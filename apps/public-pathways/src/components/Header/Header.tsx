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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { Menubar, spacing } from "~design-system";

import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { publicPathwaysTypography } from "../../styles/publicPathwaysTypography";
import { useRootStore } from "../StoreProvider";

const HeaderWrapper = styled.header`
  height: ${rem(100)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
`;

const Title = styled.h1`
  ${publicPathwaysTypography.Header24}
  margin-bottom: 0;
`;

const StyledMenubar = styled(Menubar)`
  width: auto;
  display: flex;
  align-items: center;
  padding: 0 ${rem(spacing.xs)};
  gap: ${rem(spacing.md)};

  [role="menuitem"] {
    &:hover {
      text-decoration: underline;
      outline-color: ${publicPathwaysPalette.signal.links};
    }
  }
`;

const MenuLinks = styled.div`
  display: flex;
`;

const MenuLink = styled.button`
  ${publicPathwaysTypography.Sans14}
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
  outline: none;

  &:hover {
    text-decoration: underline;
    color: ${publicPathwaysPalette.signal.links};
  }
`;

const DownloadButton = styled.button`
  ${publicPathwaysTypography.Sans14}
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-width: 110px;
  height: 38px;
  padding: 8px 16px;
  border-radius: 50px;
  border: 1px solid ${publicPathwaysPalette.signal.links};
  background-color: ${publicPathwaysPalette.signal.links};
  color: white;
  cursor: pointer;
  outline: none;
`;

export const Header = observer(function Header() {
  const { analyticsStore, metricsStore } = useRootStore();

  return (
    <HeaderWrapper>
      <Title>NYS DOCCS</Title>
      <StyledMenubar focusBorderColor={publicPathwaysPalette.signal.links}>
        <MenuLinks>
          <MenuLink
            as="a"
            href="https://drive.google.com/file/d/1AkFPJP7721NudPWua39C5F0-Xiz1_b89/view"
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => analyticsStore.trackMethodologyLinkClicked()}
          >
            How it works
          </MenuLink>
        </MenuLinks>
        <DownloadButton
          role="menuitem"
          onClick={() => {
            metricsStore.download();
            analyticsStore.trackDownloadClicked({
              metricId: metricsStore.current.id,
            });
          }}
        >
          Download
        </DownloadButton>
      </StyledMenubar>
    </HeaderWrapper>
  );
});
