# Shared Filters Package

Shared filtering functionality for filtering the optimized data formats on the [frontend](../src/) and the [backend-server](../server/).

Here's a short description for the some of the main exports:

| Function name                        | Description                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| convertFromStringToUnflattenedMatrix | Converts the given optimized array as a singular string into an unflattened 2D matrix.                                    |
| filterOptimizedDataFormat            | Takes an unflattened 2D matrix, file metadata and a filter function and returns an array of filtered data point objects.  |
| validateMetadata                     | Validates that the metadata is in the correct format and is not missing any expected values.                              |
| unflattenValues                      | Unflattens an array or string by partitioning it into several sub-arrays of length equal to the provided totalDataPoints. |

## Environment

There is a dependency between the `getFilterKeys` function and the environment of the package that is using the shared-filters. `getFilterKeys` selects the format of the filter keys (camelcase vs snake-case) by detecting whether or not it is running in a browser environment (based on the existence of `window`).

## Development

If you need your dev server to watch source changes in this package, run `nx link-shared-filters staff` in the root of this repo. This will use [`yarn link`](https://classic.yarnpkg.com/en/docs/cli/link/) to symlink the package during development. (This is also run before bundling the frontend for deployment, to prevent Vite from using an old cached version of the package.)

Changes to this package will not be hot-reloaded by Vite on the frontend; you need to restart the Vite dev server, either by killing and restarting `nx dev staff` or by saving `vite.config.mts` unchanged to trigger a Vite restart.
