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

import { palette } from "@recidiviz/design-system";
import { createContext, JSX, ReactNode, useContext, useId } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

// invisible navigation link for keyboard and screen reader users; visible on tab focus
const SkipNavContainer = styled.div`
  a {
    padding: 6px;
    position: absolute;
    top: -40px;
    left: 0px;
    color: ${palette.white};
    border-right: 1px solid white;
    border-bottom: 1px solid white;
    background: ${palette.pine3};
    z-index: 100;

    &:focus {
      position: absolute;
      left: 0px;
      top: 0px;
    }
  }
`;

type SkipNavProps = { id: string };

const SkipNavContext = createContext<SkipNavProps | undefined>(undefined);

function useSkipNavContext() {
  const context = useContext(SkipNavContext);
  if (!context) {
    throw new Error(
      "useSkipNavContext must be used within a SkipNavController",
    );
  }
  return context;
}

function SkipNav() {
  const { id } = useSkipNavContext();

  return (
    <SkipNavContainer>
      <Link to={`#${id}`} reloadDocument>
        Skip to main content
      </Link>
    </SkipNavContainer>
  );
}

type MainContentProps = Omit<JSX.IntrinsicElements["main"], "id">;

function MainContent(props: MainContentProps) {
  const { id } = useSkipNavContext();

  return <main {...props} id={id} />;
}

function SkipNavController({ children }: { children: ReactNode }) {
  const id = useId();
  return (
    <SkipNavContext.Provider value={{ id }}>{children}</SkipNavContext.Provider>
  );
}

/**
 * Returns three related components that should all be used together:
 * - SkipNav renders an invisible "skip to main content" link for keyboard navigation
 * - MainContent wraps the main content that is skipped to. It renders a `main` element
 * and accepts any props you might pass to `<main>`
  - SkipNavController keeps the link and target in sync and must be an ancestor of both
 */
export function useSkipNav() {
  return { SkipNavController, SkipNav, MainContent };
}
