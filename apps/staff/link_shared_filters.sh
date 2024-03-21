#!/usr/bin/env bash

echo "Linking shared-filters"
cd shared-filters
yarn link
cd ../../../
yarn link shared-filters
yarn install