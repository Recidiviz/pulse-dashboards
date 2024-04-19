# hydration-utils

This library contains utilities for hydrating Recidiviz applications with data in a standardized manner. Notable contents include:

- The `Hydratable` type, which defines the expected interface for hydratable objects
- Utility functions and types for interacting with `Hydratable`s
- The `ModelHydrator` component, which implements the common UI pattern of rendering a loading indicator while hydration is pending, and an error message if hydration fails.
