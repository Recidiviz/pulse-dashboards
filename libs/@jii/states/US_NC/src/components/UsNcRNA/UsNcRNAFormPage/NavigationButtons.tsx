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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { JIIButton } from "~@jii/common-ui";
import { useUsNcTranslations } from "~@jii/translation";
import { Icon, spacing } from "~design-system";

import { UsNcRNAFormPagePresenter } from "./UsNcRNAFormPagePresenter";

const RNAPageFooter = styled.div`
  margin-top: ${rem(spacing.md)};
  margin-bottom: ${rem(spacing.xl)};
  display: flex;
  justify-content: flex-end;
`;

const PreviousPageButton = styled(JIIButton)`
  margin-right: auto;
`;

export const NavigationButtons = observer(function NavigationButtons({
  presenter,
}: {
  presenter: UsNcRNAFormPagePresenter;
}) {
  const { t } = useUsNcTranslations();
  const { previous, next, submit } = t(($) => $.rna.page.navButtons, {
    returnObjects: true,
  });

  return (
    <RNAPageFooter>
      {presenter.showPrevious && (
        <PreviousPageButton
          kind={"secondary"}
          onClick={presenter.onPreviousPageButtonClick}
        >
          <Icon kind="Arrow" size={16} rotate={180} />
          <span>{previous}</span>
        </PreviousPageButton>
      )}

      {presenter.showSubmit ? (
        <JIIButton kind={"primary"} onClick={presenter.onSubmitButtonClick}>
          <span>{submit}</span>
          <Icon kind="Arrow" size={16} />
        </JIIButton>
      ) : (
        <JIIButton kind={"secondary"} onClick={presenter.onNextPageButtonClick}>
          <span>{next}</span>
          <Icon kind="Arrow" size={16} />
        </JIIButton>
      )}
    </RNAPageFooter>
  );
});
