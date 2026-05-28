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

import { MouseEvent, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

import { backLinkStyles } from "../NavigationBackButton/NavigationBackButton";
import { Link } from "./Link";

const StyledBackLink = styled(Link)`
  ${backLinkStyles}

  text-decoration: none !important;
`;

type BackLinkProps = {
  /** Where to go when there's no in-app history to pop (deep link / new tab). */
  fallbackUrl: string;
  children?: ReactNode;
  className?: string;
};

/**
 * A generic, route-agnostic back control. Renders a real anchor (via our
 * tenant-aware `Link`) whose target is the `previousPage` stamped into router
 * state by the link that brought the user here — so right-click / cmd-click
 * "open in new tab" works — while a plain left-click goes back in browser
 * history. When there's no `previousPage` (a fresh deep link / new tab), it
 * navigates to `fallbackUrl` instead of calling `navigate(-1)`, which would
 * leave the app.
 */
export const BackLink = ({
  fallbackUrl,
  children,
  className,
}: BackLinkProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const previousPage = (location.state as { previousPage?: string } | null)
    ?.previousPage;
  const target = previousPage ?? fallbackUrl;

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle modified / non-primary clicks so right-click,
    // cmd/ctrl-click, and middle-click can open `target` in a new tab.
    if (
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.defaultPrevented
    ) {
      return;
    }
    e.preventDefault();
    if (previousPage) {
      navigate(-1);
    } else {
      navigate(fallbackUrl);
    }
  };

  return (
    // state={null}: a back navigation shouldn't itself record a previousPage.
    <StyledBackLink
      to={target}
      state={null}
      onClick={onClick}
      className={className}
    >
      <i className="fa fa-angle-left" />
      {children}
    </StyledBackLink>
  );
};
