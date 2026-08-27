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

import { useNavigate, useSearchParams } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { ResourceExplorer, State } from "~@jii/paths";
import { Button } from "~design-system";

import { sanitizeBackTarget } from "../../components/BackTargetContext/sanitizeBackTarget";
import { useBackTarget } from "../../components/BackTargetContext/useBackTarget";
import { Chip } from "../../components/Chip/Chip";
import { ContactInformation } from "../../components/Contact/ContactInformation";
import { DescriptionBlock } from "../../components/DescriptionBlock/DescriptionBlock";
import { ResourceCard } from "../../components/ResourceCard/ResourceCard";
import { US_NYC_CONTENT } from "../../content";
import { useCreAnalytics } from "../../hooks/useCreAnalytics";
import { useResource } from "../../hooks/useResource";
import { useResources } from "../../hooks/useResources";
import {
  ChipList,
  PageContainer,
  PageHeader,
  PageTitle,
  Section,
  SectionHeading,
  SeeAllButtonWrapper,
  SimilarResourceList,
  SourceAttribution,
} from "./PageUsNycResourceDetail.styles";

const {
  sourceAttribution,
  labelsHeading,
  similarHeading,
  seeAllServices: seeAll,
  contactHowToReachHeading,
  contactLocationsHeading,
  lastUpdated,
} = US_NYC_CONTENT.cre.resourceDetail;

export function PageUsNycResourceDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackResourceViewed, trackDescriptionToggled } = useCreAnalytics();
  const residentParams = useTypedParams(State.Resident);
  const { category } = useTypedParams(ResourceExplorer.CategoryResults);
  const { resourceId } = useTypedParams(
    ResourceExplorer.CategoryResults.Detail,
  );

  const { name, description, contactInformation, labels } =
    useResource(resourceId);

  const { getSimilarResources } = useResources();
  const similarResources = getSimilarResources(category, resourceId);

  const categoryResultsPath =
    State.Resident.ResourceExplorer.CategoryResults.buildPath({
      ...residentParams,
      category,
    });

  const { backTarget } =
    ResourceExplorer.CategoryResults.Detail.getTypedSearchParams(searchParams);
  // Unlike the paths we build ourselves, this one comes from the URL search params and isn't safe as-is
  const safeBackTarget = sanitizeBackTarget(backTarget);
  useBackTarget(safeBackTarget ?? categoryResultsPath);

  const detailPath = (resourceId: number) => {
    const path =
      State.Resident.ResourceExplorer.CategoryResults.Detail.buildPath({
        ...residentParams,
        category,
        resourceId,
      });
    return safeBackTarget
      ? `${path}?backTarget=${encodeURIComponent(safeBackTarget)}`
      : path;
  };

  return (
    <PageContainer>
      <PageHeader>
        <SourceAttribution>{sourceAttribution}</SourceAttribution>
        <PageTitle>{name}</PageTitle>
      </PageHeader>

      {description && (
        <DescriptionBlock
          markdown={description}
          onToggle={(isExpanded) =>
            trackDescriptionToggled(resourceId, name, isExpanded)
          }
        />
      )}

      <ContactInformation
        data={contactInformation}
        generalContactHeading={contactHowToReachHeading}
        locationGroupsHeading={contactLocationsHeading}
        lastUpdated={lastUpdated}
      />

      {labels.length > 0 && (
        <Section aria-labelledby="labels-section-heading">
          <SectionHeading id="labels-section-heading">
            {labelsHeading}
          </SectionHeading>
          <ChipList>
            {labels.map((label) => (
              <Chip key={label}>{label}</Chip>
            ))}
          </ChipList>
        </Section>
      )}

      {similarResources.length > 0 && (
        <Section aria-labelledby="similar-section-heading">
          <SectionHeading id="similar-section-heading">
            {similarHeading}
          </SectionHeading>
          <SimilarResourceList>
            {similarResources.map((resource) => (
              <ResourceCard
                key={resource.organizationId}
                name={resource.name}
                to={detailPath(resource.organizationId)}
                chips={resource.tags}
                compact
                onClick={() =>
                  trackResourceViewed(resource.organizationId, resource.name)
                }
              />
            ))}
          </SimilarResourceList>
        </Section>
      )}

      <SeeAllButtonWrapper>
        <Button
          kind="secondary"
          shape="block"
          onClick={() => navigate(categoryResultsPath)}
        >
          {seeAll}
        </Button>
      </SeeAllButtonWrapper>
    </PageContainer>
  );
}
