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

import { useTypedParams } from "react-router-typesafe-routes/dom";

import { GoButton } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

import { RESOURCE_CATEGORIES } from "../../ctaConfigs";
import {
  CardsList,
  Content,
  Description,
  Heading,
  IconBlock,
  IconCircle,
  SectionLabel,
  Wrapper,
} from "./ResourceCategoryCta.styles";

export const ResourceCategoryCta = () => {
  const { t } = useUsMaTranslations();
  const routeParams = useTypedParams(State.Resident);

  return (
    <div>
      <SectionLabel>
        {t(($) => $.reentry.overview.resourceCategories.sectionLabel)}
      </SectionLabel>
      <CardsList>
        {RESOURCE_CATEGORIES.map(({ category, icon: Icon, copy }) => {
          const { heading, description, cta } = copy(t);

          return (
            <Wrapper key={category}>
              <IconBlock>
                <IconCircle>
                  <Icon size={48} />
                </IconCircle>
              </IconBlock>
              <Content>
                <Heading>{heading}</Heading>
                <Description>{description}</Description>
                <div>
                  <GoButton
                    to={State.Resident.UsMaReentry.Resources.CategoryResults.buildPath(
                      {
                        ...routeParams,
                        category,
                      },
                    )}
                  >
                    {cta}
                  </GoButton>
                </div>
              </Content>
            </Wrapper>
          );
        })}
      </CardsList>
    </div>
  );
};
