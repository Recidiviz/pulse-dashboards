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
import React from "react";

import { RequestsForInfo } from "~@idaho-th/client/components/PreviewModal/common/RequestsForInfo";
import { APPLICATION_STAGE } from "~@idaho-th/shared";

import { useHousingApplicationsStore } from "../../../../datastores/IdahoTHStoreContext";
import { useProviderInfoRequests } from "../../../../hooks/housingApplication";
import { useProviderApplicationById } from "../../../../hooks/useApplicationDetail";
import * as Styled from "../../ApplicationDetailsView/ApplicationDetailsView.styles";
import { ApplicationSectionsPanel } from "../../ApplicationDetailsView/components/ApplicationSectionsPanel";
import * as PanelStyled from "../../PreviewModal.styles";
import { ApplicationResponseSelector } from "./components/ApplicationResponseSelector";

export const ProviderApplicationDetailsView: React.FC = observer(
  function ProviderApplicationDetailsView() {
    const { currentApplicationId: applicationId } =
      useHousingApplicationsStore();
    const { data: currentApplication } = useProviderApplicationById(
      applicationId,
      false,
    );
    const { data } = useProviderInfoRequests(applicationId, true);
    const infoRequests = data?.infoRequests ?? [];
    const shouldShowInfoRequests =
      currentApplication?.stage === APPLICATION_STAGE.APPLICATION;

    return (
      <Styled.PanelRoot>
        <PanelStyled.PanelHeader>
          <PanelStyled.PanelTitle>Application details</PanelStyled.PanelTitle>
        </PanelStyled.PanelHeader>

        <Styled.PanelBody>
          <Styled.ResponseSection>
            <ApplicationResponseSelector />
          </Styled.ResponseSection>

          {shouldShowInfoRequests && (
            <RequestsForInfo
              infoRequests={infoRequests}
              providerName={currentApplication?.provider?.name ?? ""}
              staffName=""
              readOnly
            />
          )}

          <ApplicationSectionsPanel />
        </Styled.PanelBody>
      </Styled.PanelRoot>
    );
  },
);
