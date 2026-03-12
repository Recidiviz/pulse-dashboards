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

import { FC } from "react";

import {
  BackLink,
  PageLinksFooter,
  PageLinksFooterProps,
  SimpleLinkProps,
} from "~@jii/common-ui";

import { InfoPage, InfoPageProps } from "../InfoPage/InfoPage";
import { ScreenFillingWrapper } from "../ScreenFillingWrapper/ScreenFillingWrapper";

interface DefinitionPageProps extends InfoPageProps {
  backLinkProps: SimpleLinkProps;
  pageLinksFooterProps?: PageLinksFooterProps;
}

/**
 * An entire page that houses an InfoPage, with a back link at the top.
 * If footer links are provided, they will be shown at the bottom.
 */
export const DefinitionPage: FC<DefinitionPageProps> = (
  props: DefinitionPageProps,
) => {
  return (
    <ScreenFillingWrapper
      top={
        <>
          <BackLink {...props.backLinkProps} />
          <InfoPage {...props} />
        </>
      }
      bottom={
        props.pageLinksFooterProps && (
          <PageLinksFooter contents={{ ...props.pageLinksFooterProps }} />
        )
      }
    />
  );
};
