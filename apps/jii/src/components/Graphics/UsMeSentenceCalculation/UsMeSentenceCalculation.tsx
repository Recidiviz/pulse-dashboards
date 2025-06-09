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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import diagram1Url from "./diagram1.svg";
import diagram2Url from "./diagram2.svg";
import diagram3Url from "./diagram3.svg";

// above roughly this screen width, the graphics can be displayed at full size
const GRAPHIC_BREAKPOINT = 560;

const ListWrapper = styled.ol`
  padding: 0;
  margin: ${rem(spacing.xl)} 0;

  li {
    display: flex;
    flex-wrap: wrap;
    margin: ${rem(spacing.md)} 0;
    overflow: hidden;

    @media (min-width: ${GRAPHIC_BREAKPOINT}px) {
      border: 1px solid ${palette.slate20};
      border-radius: ${rem(16)};
    }
  }
`;

const ListText = styled.div`
  display: list-item;
  flex: 25 0 ${rem(100)};
  margin-left: ${rem(spacing.lg)};
  padding: ${rem(spacing.lg)} 0;

  @media (min-width: ${GRAPHIC_BREAKPOINT}px) {
    margin: 0 ${rem(spacing.lg)} 0 ${rem(spacing.xxl)};
  }
`;

const GraphicWrapper = styled.div`
  align-items: center;
  display: flex;
  flex: 1 1 auto;
  justify-content: center;

  @media (min-width: ${GRAPHIC_BREAKPOINT}px) {
    background: ${palette.marble2};
    padding: ${rem(spacing.xl)} ${rem(spacing.lg)};
  }

  img {
    max-width: 452px;
    width: 100%;
  }
`;

export const UsMeSentenceCalculation: FC = () => {
  return (
    <ListWrapper>
      <li>
        <ListText>
          Take total time you were sentenced to prison, starting from when you
          entered a DOC facility.
        </ListText>
        <GraphicWrapper>
          <img src={diagram1Url} alt="" />
        </GraphicWrapper>
      </li>
      <li>
        <ListText>
          Subtract the good time you’ve earned until today, and any jail time
          you were credited.
        </ListText>
        <GraphicWrapper>
          <img src={diagram2Url} alt="" />
        </GraphicWrapper>
      </li>
      <li>
        <ListText>
          That will give you your adjusted sentence length and your Current
          Release Date.
        </ListText>
        <GraphicWrapper>
          <img src={diagram3Url} alt="" />
        </GraphicWrapper>
      </li>
    </ListWrapper>
  );
};
