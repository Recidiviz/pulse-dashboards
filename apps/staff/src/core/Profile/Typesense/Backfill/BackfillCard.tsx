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

import { Modal, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import styled from "styled-components";

import { isOfflineMode } from "~client-env-utils";
import { Button, Icon, IconSVG, palette, TooltipTrigger } from "~design-system";

import { useTypesenseStore } from "../../../../components/StoreProvider";
import {
  BackfillOutcome,
  TypesenseStore,
} from "../../../../RootStore/TypesenseStore";
import { SectionCardHeader } from "../../../SectionCard";
import {
  CardBody,
  CardHeadline,
  ColHeader,
  DataTable,
  InfoBadgeDetail,
  InfoBadgeLabel,
  MetaBadge,
  MetaValue,
  ModalActions,
  ModalCloseButton,
  ModalDescription,
  ModalHeader,
  NameCell,
  NumCell,
  TableWrap,
  TypesenseCard,
} from "../styles";
import { envLabel, formatDurationMs, formatError } from "../util";

const CardContent = styled(CardBody)`
  max-width: ${rem(320)};
  justify-content: center;
`;

const Description = styled(CardHeadline)`
  color: ${palette.pine3};
`;

const ResultTableWrap = styled(TableWrap)`
  margin-bottom: ${rem(spacing.lg)};
`;

// to avoid clipping result modal
const StyledModal = styled(Modal)`
  .ReactModal__Content {
    width: ${rem(600)};
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${rem(spacing.sm)};
`;

const InfoIconTrigger = styled(TooltipTrigger)`
  display: inline-flex;
  cursor: help;
`;

function resultSummaryLabel(outcome: BackfillOutcome): string {
  if (outcome.status === "error") return `Failed — `;
  const { totals, durationMs } = outcome.result;
  return `${totals.imported.toLocaleString()} docs imported, ${totals.failed} failed, ${totals.deleted} deleted (${formatDurationMs(durationMs)})`;
}

const RELOAD_WARNING = (
  <>
    <strong>Note:</strong> If you reload the browser tab, it will reset the
    progress indicator, but the backfill will still continue in the background.
  </>
);

function ConfirmBackfillContents({
  store,
  onClose,
}: {
  store: TypesenseStore;
  onClose: () => void;
}) {
  return (
    <>
      <ModalHeader>Trigger a Typesense backfill?</ModalHeader>
      <ModalDescription>
        <p>
          This bulk-imports every configured Firestore collection into the{" "}
          {envLabel(store.host ?? "")} Typesense cluster. It can take several
          minutes to complete.
        </p>
        <p>{RELOAD_WARNING}</p>
      </ModalDescription>
      <ModalActions>
        <Button kind="secondary" shape="pill" onClick={onClose}>
          Cancel
        </Button>
        <Button
          shape="pill"
          onClick={() => {
            onClose();
            store.triggerBackfill().catch(() => undefined);
          }}
        >
          Yes, backfill
        </Button>
      </ModalActions>
    </>
  );
}

function BackfillResultsContents({
  outcome,
  onClose,
}: {
  outcome: BackfillOutcome | undefined;
  onClose: () => void;
}) {
  return (
    <>
      {outcome?.status === "success" && (
        <>
          <ModalHeader>Backfill complete</ModalHeader>
          <ModalDescription>
            Finished in {formatDurationMs(outcome.result.durationMs)}.
          </ModalDescription>
          <ResultTableWrap>
            <DataTable>
              <thead>
                <tr>
                  <ColHeader>Collection</ColHeader>
                  <ColHeader $right>Pages</ColHeader>
                  <ColHeader $right>Imported</ColHeader>
                  <ColHeader $right>Failed</ColHeader>
                  <ColHeader $right>Deleted</ColHeader>
                </tr>
              </thead>
              <tbody>
                {outcome.result.collections.map((collection) => (
                  <tr key={collection.name}>
                    <NameCell>{collection.name}</NameCell>
                    <NumCell>{collection.pages}</NumCell>
                    <NumCell>{collection.imported}</NumCell>
                    <NumCell>{collection.failed}</NumCell>
                    <NumCell>{collection.deleted}</NumCell>
                  </tr>
                ))}
                <tr>
                  <NameCell>
                    <strong>Total</strong>
                  </NameCell>
                  <NumCell />
                  <NumCell>
                    <strong>{outcome.result.totals.imported}</strong>
                  </NumCell>
                  <NumCell>
                    <strong>{outcome.result.totals.failed}</strong>
                  </NumCell>
                  <NumCell>
                    <strong>{outcome.result.totals.deleted}</strong>
                  </NumCell>
                </tr>
              </tbody>
            </DataTable>
          </ResultTableWrap>
        </>
      )}

      {outcome?.status === "error" && (
        <>
          <ModalHeader>Backfill failed</ModalHeader>
          <ModalDescription>{formatError(outcome.error)}</ModalDescription>
        </>
      )}
    </>
  );
}

export const BackfillCard = observer(function BackfillCard() {
  const store = useTypesenseStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContents, setModalContents] = useState<"confirm" | "result">();
  const openModal = (contents: "confirm" | "result") => {
    setModalContents(contents);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);
  const { backfillInProgress, backfillStartedAt, lastBackfillOutcome } = store;

  return (
    <TypesenseCard>
      <SectionCardHeader>
        <HeaderRow>
          <span>Backfill</span>
          <InfoIconTrigger contents={RELOAD_WARNING} positionX="left">
            <Icon kind={IconSVG.Info} size={14} color={palette.slate60} />
          </InfoIconTrigger>
        </HeaderRow>
      </SectionCardHeader>
      <CardContent>
        <Description>
          Re-imports every configured Firestore collection into Typesense.
        </Description>

        <MetaBadge>
          {backfillInProgress ? (
            <>
              <InfoBadgeLabel>
                Backfill in progress since{" "}
                {backfillStartedAt?.toLocaleTimeString()}. This can take several
                minutes.
              </InfoBadgeLabel>
              <InfoBadgeDetail>{RELOAD_WARNING}</InfoBadgeDetail>
            </>
          ) : (
            <InfoBadgeLabel>
              Last run:{" "}
              <MetaValue>
                {backfillStartedAt
                  ? backfillStartedAt.toLocaleString()
                  : "(none)"}
              </MetaValue>
            </InfoBadgeLabel>
          )}

          {!backfillInProgress && (
            <InfoBadgeLabel>
              Last result:{" "}
              <MetaValue>
                {lastBackfillOutcome
                  ? resultSummaryLabel(lastBackfillOutcome)
                  : "—"}
              </MetaValue>
              {lastBackfillOutcome && (
                <>
                  {" "}
                  <Button kind="link" onClick={() => openModal("result")}>
                    {"See details"}
                  </Button>
                </>
              )}
            </InfoBadgeLabel>
          )}
        </MetaBadge>

        <Button
          kind="secondary"
          shape="pill"
          disabled={backfillInProgress || isOfflineMode()}
          onClick={() => openModal("confirm")}
        >
          Backfill all collections
        </Button>
        {isOfflineMode() && (
          <InfoBadgeLabel>
            Manual backfill not enabled in offline mode
          </InfoBadgeLabel>
        )}
      </CardContent>

      <StyledModal isOpen={isModalOpen} onRequestClose={closeModal}>
        <ModalCloseButton onClick={closeModal} aria-label="Close modal">
          <Icon kind={IconSVG.Close} size={14} color={palette.slate60} />
        </ModalCloseButton>
        {modalContents === "confirm" && (
          <ConfirmBackfillContents store={store} onClose={closeModal} />
        )}
        {modalContents === "result" && (
          <BackfillResultsContents
            outcome={lastBackfillOutcome}
            onClose={closeModal}
          />
        )}
      </StyledModal>
    </TypesenseCard>
  );
});
