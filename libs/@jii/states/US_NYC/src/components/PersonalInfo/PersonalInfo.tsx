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
import { useState } from "react";
import styled from "styled-components";

import {
  Card,
  CardHeading,
  CardValue,
  CopyWrapper,
  HomepageSectionHeading,
  SlateCopy,
} from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { useUsNycTranslations } from "~@jii/translation";
import { palette, spacing, Toggle, typography } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { HiddenDatesCardOverride } from "../ScheduledCourtDates/HiddenDatesCardOverride";
import { PersonalInfoPresenter } from "./PersonalInfoPresenter";

const FieldCard = styled(Card)`
  margin: 0;
`;

const FieldLabel = styled(CardHeading)`
  display: block;
  color: ${palette.pine1};
`;

const CardDescription = styled(CopyWrapper)`
  display: block;
  margin-top: ${rem(spacing.lg)};

  & > p:last-child {
    margin-bottom: 0;
  }
`;

const CardSubHeading = styled(SlateCopy)`
  ${typography.Sans16}
  display: block;
  margin-top: ${rem(spacing.sm)};
`;

const HiddenSubHeading = styled(CopyWrapper)`
  display: block;
  margin-bottom: ${rem(spacing.md)};
`;

const ToggleWrapper = styled.div`
  margin-bottom: ${rem(spacing.lg)};
`;

const StyledWrapper = styled.div`
  display: grid;
  row-gap: ${rem(spacing.md)};

  margin-bottom: ${rem(spacing.lg)};
`;

const ManagedComponent: React.FC<{ presenter: PersonalInfoPresenter }> =
  observer(function ManagedComponent({ presenter }) {
    const {
      fields,
      heading,
      hidden,
      hiddenMessage,
      hiddenSubheading,
      toggleLabel,
    } = presenter;

    if (!fields.length) return null;

    return (
      <div>
        <HomepageSectionHeading>{heading}</HomepageSectionHeading>
        {hidden && <HiddenSubHeading>{hiddenSubheading}</HiddenSubHeading>}
        <StyledWrapper>
          {hidden ? (
            <HiddenDatesCardOverride>{hiddenMessage}</HiddenDatesCardOverride>
          ) : (
            fields.map(({ id, label, value, subheading, description }) => (
              <FieldCard key={id}>
                <FieldLabel>{label}</FieldLabel>
                <CardValue>{value}</CardValue>
                {subheading && <CardSubHeading>{subheading}</CardSubHeading>}
                {description && (
                  <CardDescription>{description}</CardDescription>
                )}
              </FieldCard>
            ))
          )}
        </StyledWrapper>
        <ToggleWrapper>
          <Toggle
            checked={!hidden}
            onChange={(checked) => presenter.setHidden(!checked)}
          >
            {toggleLabel}
          </Toggle>
        </ToggleWrapper>
      </div>
    );
  });

function usePresenter() {
  const stateSpecificData = useResidentMetadata("US_NYC");
  const { t } = useUsNycTranslations();
  const [hidden, setHidden] = useState(true);
  return new PersonalInfoPresenter(stateSpecificData, t, { hidden, setHidden });
}

export const PersonalInfo = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
