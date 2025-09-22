# @jii/translation

Setup, utilities and resources for i18n in the JII app

## Including types

This library includes ambient types for `i18next`, which is the recommended way to add type definitions for that library and its global instance. Any library that depends on this one directly or indirectly will need to reference those types explicitly in its `tsconfig.lib.json` and `tsconfig.spec.json` files (they unfortunately are not automatically detected when importing) by adding them to their respective `include` arrays.

The exact relative path will depend on the folder structure of your library, but in general something like `"../translation/**/*.d.ts"` will suffice.
