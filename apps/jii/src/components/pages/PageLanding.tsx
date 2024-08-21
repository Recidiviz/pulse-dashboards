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

import { Button, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { CopyWrapper } from "../CopyWrapper/CopyWrapper";
import { useRootStore } from "../StoreProvider/useRootStore";
import { Wordmark } from "../Wordmark/Wordmark";
import pageLandingCopy from "./pageLandingCopy.md?raw";

const Wrapper = styled.div`
  margin ${rem(spacing.xxl)} 12%;
  padding: 0;
`;

const Main = styled.main`
  margin-bottom: ${rem(spacing.xxl)};
`;

const Buttons = styled.div`
  display: flex;
  gap: ${rem(spacing.md)};
  justify-content: flex-start;
  margin-top: ${rem(spacing.xxl)};
`;

const LandingPageCopyWrapper = styled(CopyWrapper)`
  p,
  li {
    ${typography.Body19}
  }

  li {
    margin-bottom: 0;
  }
`;

export const PageLanding: FC = () => {
  const {
    userStore: { authClient },
  } = useRootStore();

  return (
    <Wrapper>
      <Main>
        <Wordmark width={185} />
        <LandingPageCopyWrapper>{pageLandingCopy}</LandingPageCopyWrapper>
        <Buttons>
          <Button onClick={() => authClient.logIn()}>Log in</Button>
        </Buttons>
      </Main>
      <footer>
        This website is made by Recidiviz, a non-profit organization that is
        partnered with the Maine Department of Corrections.{" "}
        <a href="https://recidiviz.org">Learn more about Recidiviz.</a>
      </footer>
    </Wrapper>
  );
};
