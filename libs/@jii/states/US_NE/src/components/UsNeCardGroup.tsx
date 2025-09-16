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

import { Icon } from "@recidiviz/design-system";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { Card, HomepageSectionHeading, SlateCopy } from "~@jii/common-ui";
import { hydrateTemplate, useSingleResidentContext } from "~@jii/data";
import { CardDateInfo } from "~@jii/earned-good-time";
import { State } from "~@jii/paths";
import { palette } from "~design-system";

import { UsNeCardGroupCopy } from "../configs/copy";
import { useUsNeContext } from "./usNeContext";

const GoLink = styled(Link)`
  display: flex;
  align-items: center;
  column-gap: 4px;
  color: ${palette.signal.links};

  text-decoration: none;

  &:hover,
  &:focus {
    text-decoration: underline;
  }
`;

const UsNeCardGroup: React.FC<{ copy: UsNeCardGroupCopy }> = ({ copy }) => {
  const { resident } = useSingleResidentContext();
  const { metadata } = useUsNeContext();

  const cards = copy.cards.map(
    ({
      id,
      tag,
      label,
      value: valueTemplate,
      summary,
      metadataField,
      definitionSlug,
    }) => {
      const value = metadata[metadataField];
      if (value === null) return null;
      return (
        <Card key={id}>
          <CardDateInfo
            tag={tag}
            label={label}
            value={hydrateTemplate(valueTemplate, { ...resident, value })}
          />
          <SlateCopy>
            {hydrateTemplate(summary, { ...resident, value })}
          </SlateCopy>
          <GoLink
            to={State.Resident.$.EGT.Definition.buildRelativePath({
              pageSlug: definitionSlug ?? id,
            })}
          >
            <span>{copy.moreInfoLink}</span>
            <Icon kind="Arrow" size={16} />
          </GoLink>
        </Card>
      );
    },
  );

  return (
    <section>
      <HomepageSectionHeading>{copy.sectionTitle}</HomepageSectionHeading>
      {cards}
    </section>
  );
};

export default UsNeCardGroup;
