// eslint-disable-next-line no-nested-ternary
export default process.env.REACT_APP_DEPLOY_ENV === "production"
  ? {
      responsiveRevamp: false,
      // TODO(395): Set to true when we have debugged the issues with the exit rate calculations
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
  : process.env.REACT_APP_DEPLOY_ENV === "staging"
  ? {
      responsiveRevamp: true,
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
      responsiveRevamp: true,
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
