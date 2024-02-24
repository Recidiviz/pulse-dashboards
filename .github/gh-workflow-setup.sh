#!/bin/bash

# create some dummy auth configs as placeholders for secrets;
# lint tests will fail without them
echo "{ }" >> ./apps/staff/src/auth_config_dev.json
echo "{ }" >> ./apps/staff/src/auth_config_production.json
echo "{ }" >> ./apps/staff/src/auth_config_demo.json
