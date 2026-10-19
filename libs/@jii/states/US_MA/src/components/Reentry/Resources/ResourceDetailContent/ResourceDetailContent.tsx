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
import { useNavigate } from "react-router-dom";

import { usePageTitle } from "~@jii/common-ui";
import { useUsMaTranslations } from "~@jii/translation";
import { Button } from "~design-system";

import { useResource } from "../../../../hooks/useResource";
import { Chip } from "../Chip/Chip";
import {
  BackButtonWrapper,
  ChipList,
  PageTitle,
  Section,
  SectionHeading,
} from "./ResourceDetailContent.styles";

export type ResourceDetailContentProps = {
  resourceId: number;
  category: string;
  backPath: string;
};

export const ResourceDetailContent: FC<ResourceDetailContentProps> = ({
  resourceId,
  category,
  backPath,
}) => {
  const { t } = useUsMaTranslations();
  const navigate = useNavigate();
  const { name, categories } = useResource(resourceId);
  usePageTitle(name);

  const subcategories = categories
    .filter((cat) => cat.category.toLowerCase() === category.toLowerCase())
    .map(({ subcategory }) => subcategory);

  return (
    <>
      <PageTitle>{name}</PageTitle>

      {subcategories.length > 0 && (
        <Section aria-labelledby="type-of-housing-heading">
          <SectionHeading id="type-of-housing-heading">
            {t(($) => $.reentry.resources.detail.typeOfHousingHeading)}
          </SectionHeading>
          <ChipList>
            {subcategories.map((subcategory) => (
              <Chip key={subcategory}>{subcategory}</Chip>
            ))}
          </ChipList>
        </Section>
      )}

      <BackButtonWrapper>
        <Button kind="secondary" onClick={() => navigate(backPath)}>
          {t(($) => $.reentry.resources.detail.backToAllResources)}
        </Button>
      </BackButtonWrapper>
    </>
  );
};
