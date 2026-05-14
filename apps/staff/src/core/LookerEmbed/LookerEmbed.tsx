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

import { getEmbedSDK } from "@looker/embed-sdk";
import { observer } from "mobx-react-lite";
import React, { useEffect, useRef } from "react";
import styled from "styled-components";

import { useRootStore } from "../../components/StoreProvider/StoreProvider";

const EmbedContainer = styled.div`
  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

type Props = {
  dashboardName: string;
  defaultFilters?: Record<string, string>;
  className?: string;
};

const LookerEmbed: React.FC<Props> = observer(function LookerEmbed({
  dashboardName,
  defaultFilters,
  className,
}) {
  const { apiStore } = useRootStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // stringify the filters so we don't retrigger the useEffect just because they're
  // a new object instance with unchanged values
  const filtersJson = JSON.stringify(defaultFilters);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sdk = getEmbedSDK();
    let sessionId: string | null = null;

    (async () => {
      const { host, model } = await apiStore.getLookerConfig();

      const dashboardId = `${model}::${dashboardName}`;

      sdk.initCookieless(
        host,
        async () => {
          const session = await apiStore.acquireLookerSession();
          sessionId = session.session_id;
          return session;
        },
        async (tokens) =>
          apiStore.generateLookerTokens({ ...tokens, session_id: sessionId }),
      );

      sdk
        .createDashboardWithId(dashboardId)
        .withFilters(JSON.parse(filtersJson ?? "null") ?? {})
        .appendTo(container)
        .build()
        .connect()
        .catch((error: Error) => {
          console.error("Looker embed connection error:", error);
        });
    })();

    return () => {
      container.innerHTML = "";
      sdk.clearSession();
    };
  }, [apiStore, dashboardName, filtersJson]);

  return <EmbedContainer ref={containerRef} className={className} />;
});

export default LookerEmbed;
