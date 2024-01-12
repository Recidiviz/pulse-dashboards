import { makeAutoObservable } from "mobx";

import { RootStore } from "../../RootStore";
import type TenantStore from "../../RootStore/TenantStore";
import { TenantId } from "../../RootStore/types";
import { Hydratable } from "../models/types";
import UsTnCompliantReportingWorkflowsImpactMetric from "../models/UsTnCompliantReportingWorkflowsImpactMetric";
import {
  DASHBOARD_VIEWS,
  DashboardView,
  DEFAULT_IMPACT_PAGE,
  DEFAULT_IMPACT_SECTION_BY_PAGE,
  IMPACT_PAGES,
  ImpactPage,
  ImpactSection,
} from "../views";

interface ImpactStoreProps {
  rootStore: RootStore;
}

export default class ImpactStore implements Hydratable {
  tenantStore: TenantStore;

  rootStore: RootStore;

  view: DashboardView = DASHBOARD_VIEWS.impact;

  page: ImpactPage = IMPACT_PAGES.compliantReportingWorkflows;

  section: ImpactSection = DEFAULT_IMPACT_SECTION_BY_PAGE[DEFAULT_IMPACT_PAGE];

  constructor({ rootStore }: ImpactStoreProps) {
    makeAutoObservable(this);

    this.rootStore = rootStore;

    this.tenantStore = this.rootStore.tenantStore;

    this.setSection = this.setSection.bind(this);
  }

  setSection(section: ImpactSection): void {
    this.section = section;
  }

  get hydrationState() {
    return this.usTnCompliantReportingWorkflowsImpact.hydrationState;
  }

  hydrate(): void {
    this.usTnCompliantReportingWorkflowsImpact.hydrate();
  }

  get currentTenantId(): TenantId | undefined {
    if (!this.tenantStore.currentTenantId) return undefined;
    return this.tenantStore.currentTenantId as TenantId;
  }

  get usTnCompliantReportingWorkflowsImpact(): UsTnCompliantReportingWorkflowsImpactMetric {
    return new UsTnCompliantReportingWorkflowsImpactMetric({
      rootStore: this,
      endpoint: "UsTnCompliantReportingWorkflowsImpact",
    });
  }
}
