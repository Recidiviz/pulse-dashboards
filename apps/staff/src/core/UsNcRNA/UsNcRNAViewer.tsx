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

import { Sans14 } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { Suspense } from "react";
import styled from "styled-components";

import { palette } from "~design-system";

import Loading from "../../components/Loading";
import useIsMobile from "../../hooks/useIsMobile";
import { CaseloadSelect } from "../CaseloadSelect";
import ErrorBoundary from "../ErrorBoundary";
import { Heading, SubHeading } from "../sharedComponents";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import { RNAListQuerier } from "./RnaListQuerier";

export const Subheading = styled(Sans14)`
  color: ${palette.slate70};
`;

export const UsNcRNAViewer = observer(function UsNcRNAViewer() {
  const { isMobile } = useIsMobile(true);
  return (
    <WorkflowsNavLayout limitedWidth={false}>
      <CaseloadSelect />
      <Heading isMobile={isMobile}>RNA Self-Report Manager</Heading>
      <SubHeading>
        The people listed below might have upcoming self-report due dates.
      </SubHeading>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <RNAListQuerier />
        </Suspense>
      </ErrorBoundary>
    </WorkflowsNavLayout>
  );
});
