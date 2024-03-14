// eslint-disable-next-line no-nested-ternary
export default import.meta.env.VITE_DEPLOY_ENV === "production"
  ? {
      enableTepeAdditionalFields: false,
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
  : import.meta.env.VITE_DEPLOY_ENV === "staging"
    ? {
        enableTepeAdditionalFields: true,
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
        enableTepeAdditionalFields: true,
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
