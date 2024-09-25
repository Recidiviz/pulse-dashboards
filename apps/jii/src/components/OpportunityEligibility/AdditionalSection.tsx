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

import { Icon } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { FC } from "react";
import { ValuesType } from "utility-types";

import { ButtonLink } from "../ButtonLink/ButtonLink";
import { CopyWrapper } from "../CopyWrapper/CopyWrapper";
import { OpportunityEligibilityPresenter } from "./OpportunityEligibilityPresenter";
import { Section, SectionHeading } from "./styles";

export const AdditionalSection: FC<{
  content: ValuesType<OpportunityEligibilityPresenter["additionalSections"]>;
}> = observer(function AdditionalSection({ content }) {
  return (
    <Section>
      <SectionHeading>{content.heading}</SectionHeading>
      <CopyWrapper>{content.body}</CopyWrapper>

      <ButtonLink to={content.linkUrl}>
        <span>{content.linkText}</span>
        <Icon kind="Arrow" size={16} />
      </ButtonLink>
    </Section>
  );
});
