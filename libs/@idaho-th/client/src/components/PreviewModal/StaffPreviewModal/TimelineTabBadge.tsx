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

import { useHousingApplicationsStore } from "../../../datastores/IdahoTHStoreContext";
import {
  useProviderTimeline,
  useStaffTimeline,
} from "../../../hooks/useTimeline";
import { TabBadge } from "../PreviewModal.styles";

function NewEventBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <TabBadge>{count > 99 ? "99+" : count}</TabBadge>;
}

export const StaffTimelineTabBadge = observer(function StaffTimelineTabBadge({
  detailLoaded = false,
}: {
  detailLoaded?: boolean;
}) {
  const { currentApplicationId } = useHousingApplicationsStore();
  const { data } = useStaffTimeline(
    currentApplicationId,
    detailLoaded && !!currentApplicationId,
  );
  return <NewEventBadge count={data?.newEventCount ?? 0} />;
});

export const ProviderTimelineTabBadge = observer(
  function ProviderTimelineTabBadge({
    detailLoaded = false,
  }: {
    detailLoaded?: boolean;
  }) {
    const { currentApplicationId } = useHousingApplicationsStore();
    const { data } = useProviderTimeline(
      currentApplicationId,
      detailLoaded && !!currentApplicationId,
    );
    return <NewEventBadge count={data?.newEventCount ?? 0} />;
  },
);
