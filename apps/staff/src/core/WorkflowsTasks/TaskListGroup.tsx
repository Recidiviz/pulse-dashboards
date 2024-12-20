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

import { Icon, palette, Pill } from "@recidiviz/design-system";
import React, { ReactNode } from "react";
import {
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
  AccordionItemState,
} from "react-accessible-accordion";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { Divider } from "./styles";

const CountPill = styled(Pill)`
  background-color: ${palette.slate10};
`;

type TaskListGroupProps<T = any> = {
  title: string;
  uuid: string;
  items: T[];
  renderer: (ele: T) => ReactNode;
};

export const TaskListGroup: React.FC<TaskListGroupProps> = ({
  title,
  uuid,
  items,
  renderer,
}) => {
  const { analyticsStore } = useRootStore();
  return (
    <AccordionItem
      uuid={uuid}
      onClick={() => analyticsStore.trackTaskHeaderToggled(title)}
    >
      <Divider />
      <AccordionItemHeading>
        <AccordionItemButton>
          <AccordionItemState>
            {({ expanded }) => (
              <Icon
                kind={"DownChevron"}
                size={14}
                rotate={expanded ? 0 : 270}
              />
            )}
          </AccordionItemState>{" "}
          {title} <CountPill color={"white"}>{items.length}</CountPill>
        </AccordionItemButton>
      </AccordionItemHeading>
      <AccordionItemPanel>
        {items.map((item) => renderer(item))}
      </AccordionItemPanel>
    </AccordionItem>
  );
};
