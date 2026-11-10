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
import { StatusBadge } from "~@idaho-th/client/components/StatusBadge";
import { useUserStore } from "~@idaho-th/client/datastores/IdahoTHStoreContext";
import type { ProviderHousingApplication } from "~@idaho-th/client/interfaces/common";
import { filterMatchLabels } from "~@idaho-th/client/utils/labelGenerator";
import { APPLICATION_SUB_STAGE } from "~@idaho-th/shared";

import ArrowLeftIcon from "../../../../assets/arrow-left.svg?react";
import BuildingIcon from "../../../../assets/building-icon.svg?react";
import ClockIcon from "../../../../assets/tabler-icon-clock.svg?react";
import MailIcon from "../../../../assets/tabler-icon-mail.svg?react";
import PhoneIcon from "../../../../assets/tabler-icon-phone.svg?react";
import UserIcon from "../../../../assets/user-icon.svg?react";
import type { ProviderInfoRequest } from "../../../common/InfoRequest";
import {
  AcceptAsHomePlanButton,
  PreferredBadge,
  ProviderLabels,
} from "../../common";
import { useSubmitStaffInfoReply } from "../hooks/useSubmitStaffInfoReply";
import { InfoItem } from "./InfoItem";
import { LocationsSection } from "./LocationsSection";
import * as Styled from "./ProviderDetailView.styles";

interface InfoRequestsSectionProps {
  providerApplicationId: string;
  providerName: string;
  infoRequests: ProviderInfoRequest[];
}

const InfoRequestsSection = observer(function InfoRequestsSection({
  providerApplicationId,
  providerName,
  infoRequests,
}: InfoRequestsSectionProps) {
  const userStore = useUserStore();
  const staffName = userStore.user?.nickname ?? "";
  const handleSubmitInfo = useSubmitStaffInfoReply(providerApplicationId);

  return (
    <>
      <Styled.Divider />
      <RequestsForInfo
        infoRequests={infoRequests}
        providerName={providerName}
        staffName={staffName}
        onSubmitInfo={handleSubmitInfo}
      />
    </>
  );
});

interface ProviderDetailViewProps {
  provider: ProviderHousingApplication;
  onBack: () => void;
}

export const ProviderDetailView: React.FC<ProviderDetailViewProps> = observer(
  function ProviderDetailView({ provider, onBack }) {
    const {
      providerId,
      providerApplicationId,
      providerName,
      providerLocation,
      labels,
      isPreferred,
      subStage,
      infoRequests = [],
      contact,
    } = provider;

    const isConditionallyApproved =
      subStage === APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED;

    const shouldShowInfoRequests =
      !!providerApplicationId &&
      infoRequests.length > 0 &&
      !isConditionallyApproved;

    const matchedLabels = filterMatchLabels(labels);

    return (
      <Styled.DetailRoot>
        <Styled.DetailHeader>
          <Styled.HeaderContainer>
            <Styled.BackButton type="button" onClick={onBack}>
              <ArrowLeftIcon />
            </Styled.BackButton>
            <Styled.TitleContainer>
              <Styled.Title>{providerName}</Styled.Title>
              <ProviderLabels labels={matchedLabels} />
            </Styled.TitleContainer>
          </Styled.HeaderContainer>
        </Styled.DetailHeader>

        <Styled.DetailContent>
          <Styled.InfoList>
            <InfoItem
              icon={<BuildingIcon />}
              label="Ranking"
              value={isPreferred && <PreferredBadge />}
            />{" "}
            <InfoItem
              icon={
                <Styled.UserIconWrapper>
                  <UserIcon />
                </Styled.UserIconWrapper>
              }
              label="Contact name"
              value={
                contact?.contactName && (
                  <Styled.InfoValue>{contact.contactName}</Styled.InfoValue>
                )
              }
            />
            <InfoItem
              icon={<MailIcon />}
              label="Email"
              value={
                contact?.email && (
                  <Styled.InfoValue>{contact.email}</Styled.InfoValue>
                )
              }
            />
            <InfoItem
              icon={<PhoneIcon />}
              label="Phone number"
              value={
                contact?.contactPhone && (
                  <Styled.InfoValue>{contact.contactPhone}</Styled.InfoValue>
                )
              }
            />
            {subStage && (
              <InfoItem
                icon={<ClockIcon />}
                label="Status"
                value={<StatusBadge status={subStage} />}
              />
            )}
            {isConditionallyApproved && (
              <Styled.ButtonWrapper>
                <AcceptAsHomePlanButton providerId={providerId} />
              </Styled.ButtonWrapper>
            )}
          </Styled.InfoList>

          <Styled.Divider />
          <LocationsSection location={providerLocation} />

          {shouldShowInfoRequests && (
            <InfoRequestsSection
              providerApplicationId={providerApplicationId}
              providerName={providerName}
              infoRequests={infoRequests}
            />
          )}
        </Styled.DetailContent>
      </Styled.DetailRoot>
    );
  },
);
