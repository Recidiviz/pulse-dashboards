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

import { typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { FC } from "react";
import styled from "styled-components";

import { Button } from "~design-system";

import { ResultsPagePresenter } from "./ResultsPagePresenter";

const Wrapper = styled.div`
  ${typography.Sans12}

  button {
    ${typography.Sans12}
    text-decoration: underline;
  }
`;

export const SubmissionDateandUndo: FC<{
  presenter: ResultsPagePresenter;
}> = observer(function SubmissionDateandUndo({ presenter }) {
  if (!presenter.formattedSubmissionDate) return null;

  return (
    <Wrapper>
      Submitted {presenter.formattedSubmissionDate}.{" "}
      <Button kind={"link"} onClick={() => presenter.clearSubmitted()}>
        Undo
      </Button>
    </Wrapper>
  );
});
