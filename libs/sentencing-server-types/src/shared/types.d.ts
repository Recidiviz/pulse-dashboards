// Put types that need to be exported to other apps here

// This is a workaround for the fact that we can't enforce type-only exports from a project
// TODO(https://github.com/Recidiviz/recidiviz-data/issues/31084): Remove this lint exception once sentencing-server code gets moved into a library
// eslint-disable-next-line @nx/enforce-module-boundaries
export type { AppRouter } from "~sentencing-server/shared/types";
