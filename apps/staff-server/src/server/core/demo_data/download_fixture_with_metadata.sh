#!/usr/bin/env bash
#parse file name
file=$(echo $1 | sed 's:.*/::')
file_extension=${file##*.}
file_name=${file%%.*}

if [ $file_extension == 'txt' ] || [ $file_extension == 'json' ]
then
  echo "Downloading data file"
  gcloud storage cp "$1" apps/staff/server/core/demo_data/
else
  echo "The file format you specified is unsupported. Supported file formats are .txt and .json"
  exit
fi

if [ $file_extension == 'txt' ]
then
  echo "Downloading metadata"
  # The three values live in the object's custom metadata. gsutil printed them as
  # "key: value" text that was then split on the first colon, which broke on any
  # JSON value containing a colon. `objects describe --format=json` returns them
  # structured under .custom_fields, so read them as JSON instead of as text.
  metadata=$(gcloud storage objects describe "$1" --format=json |
    jq -c '{
      value_keys: (.custom_fields.value_keys | fromjson),
      dimension_manifest: (.custom_fields.dimension_manifest | fromjson),
      total_data_points: (.custom_fields.total_data_points | fromjson)
    }')

  echo "$metadata" > apps/staff/server/core/demo_data/"$file_name".metadata.json
fi
