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

import { Header34 } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC, ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components";

import { BackLink, SlateCopy, usePageTitle } from "~@jii/common-ui";
import { useRootStore, useSingleResidentContext } from "~@jii/data";
import { State } from "~@jii/paths";
import { useUsNeTranslations } from "~@jii/translation";
import { Button, spacing } from "~design-system";
import {
  Hydratable,
  HydratorWithErrorLogging,
  withPresenterManager,
} from "~hydration-utils";

import { ChecklistProgressBar } from "./ChecklistProgressBar";
import { ChecklistSection } from "./ChecklistSection";
import { UnsavedChangesModal } from "./UnsavedChangesModal";
import { UsNeReentryChecklistPresenter } from "./UsNeReentryChecklistPresenter";

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

export const SaveButtonContainer = styled.div`
  display: flex;
  margin-bottom: ${rem(spacing.lg)};
`;

const ManagedComponent = observer(function ManagedComponent({
  presenter,
}: {
  presenter: UsNeReentryChecklistPresenter;
}) {
  const { t } = useUsNeTranslations();
  const params = useTypedParams(State.Resident);
  const navigate = useNavigate();
  const [isUnsavedChangesModalOpen, setIsUnsavedChangesModalOpen] =
    useState(false);
  usePageTitle(t(($) => $.reentryChecklist.pageTitle));

  const backPath = State.Resident.buildPath(params);

  const handleBackClick = (e: React.MouseEvent) => {
    if (presenter.isDirty) {
      e.preventDefault();
      setIsUnsavedChangesModalOpen(true);
    }
  };

  return (
    <PageWrapper>
      <BackLink to={State.Resident.buildPath(params)} onClick={handleBackClick}>
        {t(($) => $.reentryChecklist.backLink)}
      </BackLink>
      <Header34 as="h1">{t(($) => $.reentryChecklist.pageTitle)}</Header34>
      <SlateCopy>{t(($) => $.reentryChecklist.subtitle)}</SlateCopy>

      <ChecklistProgressBar
        {...presenter.progressMetrics}
        lastSavedTimestamp={presenter.lastSaved}
      />

      {presenter.sections.map((section) => (
        <ChecklistSection
          key={section.id}
          section={section}
          onToggleCheckbox={(itemId) => presenter.toggleCheckbox(itemId)}
        />
      ))}

      {presenter.writeError && (
        <SlateCopy>
          {t(($) => $.reentryChecklist.writeErrorMessage, {
            error: presenter.writeError,
          })}
        </SlateCopy>
      )}

      <SaveButtonContainer>
        <Button
          onClick={() => presenter.saveState()}
          disabled={!presenter.isDirty || presenter.isSaving}
        >
          {presenter.isSaving
            ? t(($) => $.reentryChecklist.savingButton)
            : t(($) => $.reentryChecklist.saveButton)}
        </Button>
      </SaveButtonContainer>

      <UnsavedChangesModal
        isOpen={isUnsavedChangesModalOpen}
        onCancel={() => setIsUnsavedChangesModalOpen(false)}
        onDiscard={() => navigate(backPath)}
      />
    </PageWrapper>
  );
});

const FallbackComponent = ({ error }: { error: Error }) => {
  return <div>Error loading reentry checklist: {error.message}</div>;
};

const ChecklistHydrator: FC<{
  children: ReactNode;
  hydratable: Hydratable;
}> = ({ children, hydratable }) => {
  return (
    <HydratorWithErrorLogging
      hydratable={hydratable}
      fallback={FallbackComponent}
    >
      {children}
    </HydratorWithErrorLogging>
  );
};

function usePresenter() {
  const { resident, residentFlags } = useSingleResidentContext();
  const { apiClient } = useRootStore();
  return new UsNeReentryChecklistPresenter(resident, apiClient, residentFlags);
}

const UsNeReentryChecklistPage = withPresenterManager({
  ManagedComponent,
  usePresenter,
  managerIsObserver: true,
  HydratorComponent: ChecklistHydrator,
});

export default UsNeReentryChecklistPage;
