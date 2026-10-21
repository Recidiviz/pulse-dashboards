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
import { ContactInformation } from "../Contact/ContactInformation";
import { buildContactInformation } from "../Contact/utils";
import { KeyDetails } from "../KeyDetails/KeyDetails";
import { getKeyDetails } from "../KeyDetails/utils";
import {
  BackButtonWrapper,
  ChipList,
  Heading,
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
  const resource = useResource(resourceId);
  const { name, categories, tags, categoryAttributes } = resource;
  usePageTitle(name);

  const subcategories = categories
    .filter((cat) => cat.category.toLowerCase() === category.toLowerCase())
    .map(({ subcategory }) => subcategory);

  return (
    <>
      <Heading>{name}</Heading>

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

      {categoryAttributes?.category === "Housing" && (
        <Section aria-labelledby="key-details-heading">
          <SectionHeading id="key-details-heading">
            {t(($) => $.reentry.resources.detail.keyDetails.heading)}
          </SectionHeading>
          <KeyDetails
            details={getKeyDetails({ tags }, categoryAttributes, t)}
          />
        </Section>
      )}

      <Section aria-labelledby="contact-heading">
        <SectionHeading id="contact-heading">
          {t(($) => $.reentry.resources.detail.contact.heading)}
        </SectionHeading>
        <ContactInformation rows={buildContactInformation(resource, t)} />
      </Section>

      <BackButtonWrapper>
        <Button kind="secondary" onClick={() => navigate(backPath)}>
          {t(($) => $.reentry.resources.detail.backToAllResources)}
        </Button>
      </BackButtonWrapper>
    </>
  );
};
