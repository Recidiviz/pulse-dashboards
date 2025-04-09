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

import { Button, palette, spacing, typography } from "@recidiviz/design-system";
import Markdown from "markdown-to-jsx";
import { rem } from "polished";
import { FC, ReactNode } from "react";
import { useTypedSearchParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components/macro";

import recidivizWordmarkUrl from "../../assets/images/recidiviz-wordmark-white.svg";
import { ReturnToPathFragment } from "../../routes/routes";
import { PAGE_WIDTH } from "../../utils/constants";
import { FullBleedContainer } from "../BaseLayout/BaseLayout";
import { useRootStore } from "../StoreProvider/useRootStore";
import { Wordmark } from "../Wordmark/Wordmark";

const CONTENT_WIDTH = PAGE_WIDTH * 0.8;

const Wrapper = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  margin: 0 auto;
  max-width: ${rem(CONTENT_WIDTH)};
  min-height: 100vh;
`;

const Header = styled.header`
  padding: ${rem(spacing.xxl)} 0;
`;

const Main = styled.main`
  padding-bottom: ${rem(spacing.xxl)};
`;

const Footer = styled(FullBleedContainer).attrs({ as: "footer" })`
  background: #001414;
`;

const Left = styled.div`
  flex: 1 1 60%;
`;
const Right = styled.div`
  flex: 0 0 auto;
`;

const FooterContents = styled.div`
  color: ${palette.white};
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 15%;
  margin: 0 auto;
  max-width: ${rem(CONTENT_WIDTH + spacing.md * 2)};
  padding: ${rem(spacing.xxl)} ${rem(spacing.md)};
  text-wrap: balance;

  h2 {
    ${typography.Sans14}
  }

  p,
  button {
    ${typography.Body14}
  }

  /* in some places we need more specificity */
  a,
  p a,
  button {
    color: ${palette.signal.highlight};
  }

  button {
    margin: 0;
    text-decoration: underline;
  }
`;

const RecidivizWordmark = styled.img.attrs({
  alt: "Recidiviz",
  src: recidivizWordmarkUrl,
})`
  display: inline-block;
  margin-left: 0.4em;
  height: 1.4em;
  width: auto;
`;

const landingPageConfig = {
  aboutRecidivizCopy: `Recidiviz is a technology non-profit that builds tools for
  Departments of Corrections across the country. 
  
  [Learn more about Recidiviz](https://recidiviz.org)`,
};

export const LandingPageLayout: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const {
    userStore: {
      authManager: { authClient },
    },
  } = useRootStore();
  const [{ returnToPath }] = useTypedSearchParams(ReturnToPathFragment);

  return (
    <Wrapper>
      <Header>
        <Wordmark width={192} />
      </Header>
      <Main>{children}</Main>
      <Footer>
        <FooterContents>
          <Left>
            <h2>
              Made by <RecidivizWordmark />
            </h2>
            <Markdown>{landingPageConfig.aboutRecidivizCopy}</Markdown>
          </Left>
          <Right>
            <h2>For staff</h2>
            <p>
              <Button
                kind="link"
                onClick={() =>
                  authClient?.logIn({
                    targetPath: returnToPath ?? window.location.pathname,
                  })
                }
              >
                Log in to Opportunities
              </Button>
            </p>
            <p>
              <a href="mailto:feedback@recidiviz.org">Contact us</a>
            </p>
          </Right>
        </FooterContents>
      </Footer>
    </Wrapper>
  );
};
