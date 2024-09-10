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
import { useRootStore } from "../StoreProvider/useRootStore";
import { Wordmark } from "../Wordmark/Wordmark";

const Wrapper = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  margin: 0 auto;
  max-width: ${rem(PAGE_WIDTH * 0.8)};
  min-height: 100vh;
`;

const Header = styled.header`
  padding: ${rem(spacing.xxl)} 0;
`;

const Main = styled.main`
  padding-bottom: ${rem(spacing.xxl)};
`;

const Footer = styled.footer`
  background: #001414;
  color: ${palette.white};
  column-gap: 15%;
  display: grid;
  grid-template-columns: 1fr auto;
  padding: ${rem(spacing.xxl)} 0;
  position: relative;

  &:before {
    content: "";
    z-index: -1;
    position: absolute;
    top: 0;
    /* extra overflow to cover up the padding from BaseLayout */
    bottom: -${rem(spacing.md)};
    left: -100vw;
    right: -100vw;
    background: inherit;
  }

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
    userStore: { authClient },
  } = useRootStore();
  const [{ returnToPath }] = useTypedSearchParams(ReturnToPathFragment);

  return (
    <Wrapper>
      <Header>
        <Wordmark width={192} />
      </Header>
      <Main>{children}</Main>
      <Footer>
        <div>
          <h2>
            Made by <RecidivizWordmark />
          </h2>
          <Markdown>{landingPageConfig.aboutRecidivizCopy}</Markdown>
        </div>
        <div>
          <h2>For staff</h2>
          <p>
            <Button
              kind="link"
              onClick={() =>
                authClient.logIn({
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
        </div>
      </Footer>
    </Wrapper>
  );
};
