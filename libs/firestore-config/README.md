# firestore-config

## Collection utils

This library houses some utilities for interacting with Firestore collections using our standard naming conventions (e.g. an enum of certain known collection names, a function for converting any collection name into its demo equivalent, associated types).

## Security rules

This library also contains Firestore security rules and scripts for testing and deploying them. These are not directly depended on by any other packages, but both the `staff` and `jii` apps use the Firestore databases that are configured by this library.
