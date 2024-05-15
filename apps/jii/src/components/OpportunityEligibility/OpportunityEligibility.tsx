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

import Markdown from "markdown-to-jsx";
import { observer } from "mobx-react-lite";
import { FC } from "react";
import { Link } from "react-router-dom";

import { IncarcerationOpportunityId } from "../../configs/types";
import { PageHydrator } from "../PageHydrator/PageHydrator";
import { useRootStore } from "../StoreProvider/useRootStore";
import { OpportunityEligibilityPresenter } from "./OpportunityEligibilityPresenter";

const OpportunityEligibilityWithPresenter: FC<{
  presenter: OpportunityEligibilityPresenter;
}> = observer(function OpportunityEligibilityWithPresenter({ presenter }) {
  return (
    <article>
      <h1>{presenter.headline}</h1>
      <h2>{presenter.subheading}</h2>
      <section>
        {presenter.aboutContent.sections.map((s, i) => (
          <div key={s.heading}>
            {i ? <h2>{s.heading}</h2> : <h1>{s.heading}</h1>}
            <Markdown>{s.body}</Markdown>
          </div>
        ))}
        <Link to={presenter.aboutContent.linkUrl}>
          {presenter.aboutContent.linkText}
        </Link>
      </section>
      <section>
        <h1>Requirements</h1>
        <dl>
          {!!presenter.requirementsContent.requirementsMet.length && (
            <>
              <dt>Requirements you've met</dt>
              <dd>
                <ul>
                  {presenter.requirementsContent.requirementsMet.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </dd>
            </>
          )}
          {!!presenter.requirementsContent.requirementsNotMet.length && (
            <>
              <dt>Requirements you haven't met yet</dt>
              <dd>
                <ul>
                  {presenter.requirementsContent.requirementsNotMet.map((r) => (
                    <li key={r.criterion}>
                      {r.criterion}
                      {r.ineligibleReason && (
                        <>
                          <br />
                          {r.ineligibleReason}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </dd>
            </>
          )}
          <dt>
            Check with your case manager to see if you’ve met these requirements
          </dt>
          <dd>
            <ul>
              {presenter.requirementsContent.untrackedCriteria.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </dd>
        </dl>
        {presenter.requirementsContent && (
          <Link to={presenter.requirementsContent.linkUrl}>
            {presenter.requirementsContent.linkText}
          </Link>
        )}
      </section>
      <section>
        <h1>Next steps</h1>
        <Markdown>{presenter.nextStepsContent.body}</Markdown>
        <Link to={presenter.nextStepsContent.linkUrl}>
          {presenter.nextStepsContent.linkText}
        </Link>
      </section>
    </article>
  );
});

export const OpportunityEligibility: FC<{
  opportunityId: IncarcerationOpportunityId;
  residentExternalId: string;
}> = observer(function OpportunityEligibility({
  opportunityId,
  residentExternalId,
}) {
  const { residentsStore } = useRootStore();
  if (!residentsStore) return null;

  const config =
    residentsStore.config.incarcerationOpportunities[opportunityId];
  if (!config) {
    throw new Error(`Missing configuration for ${opportunityId}`);
  }

  const presenter = new OpportunityEligibilityPresenter(
    residentsStore,
    residentExternalId,
    opportunityId,
    config,
  );
  return (
    <PageHydrator hydratable={presenter}>
      <OpportunityEligibilityWithPresenter presenter={presenter} />
    </PageHydrator>
  );
});
