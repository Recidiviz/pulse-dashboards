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

import { Button } from "@recidiviz/design-system";
import { FC } from "react";

import { CopyWrapper } from "../../../../components/CopyWrapper/CopyWrapper";
import { Modal } from "../../../../components/Modal/Modal";
import { useModal } from "../../../../components/Modal/useModal";
import { hydrateTemplate } from "../../../../configs/hydrateTemplate";
import { useEGTDataContext } from "../EGTDataContext/context";

const DateInfo: FC<{ tag: string; label: string; value: string }> = ({
  tag,
  label,
  value,
}) => {
  const { data } = useEGTDataContext();
  return (
    <>
      <h3>
        <abbr>{tag}</abbr> {label}
      </h3>
      <div>{hydrateTemplate(value, data)}</div>
    </>
  );
};

const AdjustmentBreakdownItem: FC<{ label: string; value: string }> = ({
  label,
  value,
}) => {
  const { data } = useEGTDataContext();
  return (
    <>
      <dt>{label}</dt>
      <dd>{hydrateTemplate(value, data)}</dd>
    </>
  );
};

export const DatesSection = () => {
  const {
    data,
    copy: {
      home: { dates, moreInfoButton },
    },
  } = useEGTDataContext();
  const { showModal, modalProps } = useModal();

  return (
    <article>
      <h2>{dates.sectionTitle}</h2>
      <section>
        <DateInfo {...dates.rts} />
        <Button onClick={() => showModal()}>{moreInfoButton}</Button>
        <Modal {...modalProps}>
          <h2>{dates.rts.label}</h2>
          <CopyWrapper>{dates.rts.moreInfo}</CopyWrapper>
        </Modal>
      </section>
      <section>
        <DateInfo {...dates.maxRelease} />
        {!!data.totalStateCreditDaysCalculated && (
          <>
            <div>{hydrateTemplate(dates.maxRelease.summary, data)}</div>
            <dl>
              <AdjustmentBreakdownItem
                {...dates.maxRelease.breakdown.original}
              />
              <AdjustmentBreakdownItem {...dates.maxRelease.breakdown.change} />
              <AdjustmentBreakdownItem
                {...dates.maxRelease.breakdown.adjusted}
              />
            </dl>
          </>
        )}
      </section>
      <section>
        <DateInfo {...dates.parole} />
      </section>
    </article>
  );
};
