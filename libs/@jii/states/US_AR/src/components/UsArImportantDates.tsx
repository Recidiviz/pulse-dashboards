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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { GoButton, HomepageSectionHeading } from "~@jii/common-ui";
import { useSingleResidentContext } from "~@jii/data";
import { State } from "~@jii/paths";
import { UsArResidentJiiData } from "~@jii/schemas";
import { useUsArTranslations } from "~@jii/translation";
import { withPresenterManager } from "~hydration-utils";

import { DateInfoCard } from "./DateInfoCard";
import { UsArImportantDatesPresenter } from "./UsArImportantDatesPresenter";

const LinkContainer = styled.div`
  margin-top: ${rem(spacing.lg)};
  margin-bottom: ${rem(spacing.lg)};
`;

type UsArImportantDatesProps = { metadata: UsArResidentJiiData };

const ManagedComponent: React.FC<{ presenter: UsArImportantDatesPresenter }> =
  observer(function UsArImportantDates({ presenter }) {
    const { t } = useUsArTranslations();

    return (
      <section>
        <HomepageSectionHeading>
          {t(($) => $.importantDates.sectionHeader)}
        </HomepageSectionHeading>

        {presenter.dateEntries.map((dateInfo) => (
          <DateInfoCard {...dateInfo} key={dateInfo.label} />
        ))}

        <LinkContainer>
          <GoButton
            to={State.Resident.$.UsArMoreInformation.ImportantDates.buildRelativePath(
              {},
            )}
          >
            {t(($) => $.importantDates.moreInfoLink)}
          </GoButton>
        </LinkContainer>
      </section>
    );
  });

function usePresenter({ metadata }: UsArImportantDatesProps) {
  const { residentFlags } = useSingleResidentContext();
  const { t } = useUsArTranslations();

  return new UsArImportantDatesPresenter(metadata, residentFlags, t);
}

export const UsArImportantDates = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
