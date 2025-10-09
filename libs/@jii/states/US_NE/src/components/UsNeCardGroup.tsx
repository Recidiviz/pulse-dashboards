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

import {
  Card,
  GoLink,
  HomepageSectionHeading,
  SlateCopy,
} from "~@jii/common-ui";
import { hydrateTemplate, useSingleResidentContext } from "~@jii/data";
import { CardDateInfo } from "~@jii/earned-good-time";
import { State } from "~@jii/paths";

import { UsNeCardGroupCopy } from "../configs/copy";
import { useUsNeContext } from "./usNeContext";

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
          <SlateCopy options={{ forceBlock: true }}>
            {hydrateTemplate(summary, { ...resident, value })}
          </SlateCopy>
          <GoLink
            to={State.Resident.$.EGT.Definition.buildRelativePath({
              pageSlug: definitionSlug ?? id,
            })}
          >
            {copy.moreInfoLink}
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
