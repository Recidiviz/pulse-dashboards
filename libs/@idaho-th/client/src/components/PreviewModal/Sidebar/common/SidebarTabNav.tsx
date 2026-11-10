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

import { usePreviewModalStore } from "../../../../datastores/IdahoTHStoreContext";
import { BodyS1 } from "../../../../styles";
import { TabDef } from "../../constants";
import * as Styled from "../../PreviewModal.styles";

interface SidebarTabNavProps {
  tabs: TabDef[];
  detailLoaded?: boolean;
}

export const SidebarTabNav: React.FC<SidebarTabNavProps> = observer(
  function SidebarTabNav({ tabs, detailLoaded = false }) {
    const previewModalStore = usePreviewModalStore();
    const activeTab = previewModalStore.activeTab;

    return (
      <Styled.NavContainer>
        {tabs.map(({ id, label, Icon, Badge }) => (
          <Styled.NavItem
            key={id}
            type="button"
            $active={activeTab === id}
            onClick={() => previewModalStore.setActiveTab(id)}
          >
            <Icon />
            <BodyS1>{label}</BodyS1>
            {Badge && <Badge detailLoaded={detailLoaded} />}
          </Styled.NavItem>
        ))}
      </Styled.NavContainer>
    );
  },
);
