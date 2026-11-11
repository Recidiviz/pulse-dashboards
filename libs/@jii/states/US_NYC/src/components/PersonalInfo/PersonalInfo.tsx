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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { Card, CardHeading, CardValue } from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { useUsNycTranslations } from "~@jii/translation";
import { palette, spacing, typography } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { PersonalInfoPresenter } from "./PersonalInfoPresenter";

const SectionHeading = styled.h2`
  ${typography.Sans24}
  color: ${palette.pine1};

  margin: 0 0 ${rem(spacing.md)};
`;

const CardDescription = styled.p`
  ${typography.Sans16}
  color: ${palette.pine1};
`;

const CardSubHeading = styled.div`
  ${typography.Sans16}
  color: ${palette.slate70};
`;

const ManagedComponent: React.FC<{ presenter: PersonalInfoPresenter }> =
  observer(function ManagedComponent({ presenter }) {
    const { fields, heading } = presenter;

    if (!fields.length) return null;

    return (
      <section>
        <SectionHeading>{heading}</SectionHeading>
        {fields.map(({ id, label, value, subheading, description }) => (
          <Card key={id}>
            <CardHeading>{label}</CardHeading>
            <CardValue>{value}</CardValue>
            {subheading && <CardSubHeading>{subheading}</CardSubHeading>}
            {description && <CardDescription>{description}</CardDescription>}
          </Card>
        ))}
      </section>
    );
  });

function usePresenter() {
  const stateSpecificData = useResidentMetadata("US_NYC");
  const { t } = useUsNycTranslations();
  return new PersonalInfoPresenter(stateSpecificData, t);
}

export const PersonalInfo = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
