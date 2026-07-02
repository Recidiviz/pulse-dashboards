# Staff Shared Filters

Shared filtering and optimization logic for the optimized data formats, used by both the [staff frontend](/apps/staff) and the legacy [staff server](/apps/staff-server) backend.

This is a `scope:universal` library so it can be imported by both the client frontend and the server. Its public interface is exported from `src/index.ts` and consumed via the `~staff-shared-filters` path alias.

Here's a short description for some of the main exports:

| Function name                        | Description                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| convertFromStringToUnflattenedMatrix | Converts the given optimized array as a singular string into an unflattened 2D matrix.                                    |
| filterOptimizedDataFormat            | Takes an unflattened 2D matrix, file metadata and a filter function and returns an array of filtered data point objects.  |
| validateMetadata                     | Validates that the metadata is in the correct format and is not missing any expected values.                              |
| unflattenValues                      | Unflattens an array or string by partitioning it into several sub-arrays of length equal to the provided totalDataPoints. |

## Environment

There is a dependency between the `getFilterKeys` function and the environment of the package that is using it. `getFilterKeys` selects the format of the filter keys (camelcase vs snake-case) by detecting whether or not it is running in a browser environment (based on the existence of `window`).
