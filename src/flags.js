// eslint-disable-next-line no-nested-ternary
export default process.env.REACT_APP_DEPLOY_ENV === "production"
  ? {
      // TODO(395): Set to true when we have debugged the issues with the exit rate calculations
      enableRevocationRateByExit: false,
      enableVitalsGoalLine: false,
      defaultMetricBackend: "OLD",
      metricBackendOverrides: {
        // These need to be set so that PathwaysMetric actually hydrates (since the default is OLD)
        prisonPopulationOverTime: "NEW",
        supervisionPopulationOverTime: "NEW",
        supervisionToLibertyOverTime: "NEW",
        prisonToSupervisionPopulationOverTime: "NEW",
        libertyToPrisonPopulationOverTime: "NEW",
        supervisionToPrisonOverTime: "NEW",
      },
    }
  : process.env.REACT_APP_DEPLOY_ENV === "staging"
  ? {
      enableRevocationRateByExit: false,
      enableVitalsGoalLine: false,
      defaultMetricBackend: "NEW",
      metricBackendOverrides: {
        // The new backend doesn't have officer names yet
        supervisionToPrisonPopulationByOfficer: "OLD",
        // The new backend doesn't handle projections yet
        projectedPrisonPopulationOverTime: "OLD",
        projectedSupervisionPopulationOverTime: "OLD",
      },
    }
  : {
      // Development
      enableRevocationRateByExit: false,
      enableVitalsGoalLine: false,
      defaultMetricBackend: "NEW",
      metricBackendOverrides: {
        // The new backend doesn't have officer names yet
        supervisionToPrisonPopulationByOfficer: "OLD",
        // The new backend doesn't handle projections yet
        projectedPrisonPopulationOverTime: "OLD",
        projectedSupervisionPopulationOverTime: "OLD",
      },
    };
