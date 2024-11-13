#!/usr/bin/env bash
#parse file name
file=$(echo $1 | sed 's:.*/::')
file_extension=${file##*.}
file_name=${file%%.*}

if [ $file_extension == 'txt' ] || [ $file_extension == 'json' ]
then
  echo "Downloading data file"
  gsutil cp $1 apps/staff/server/core/demo_data/
else
  echo "The file format you specified is unsupported. Supported file formats are .txt and .json"
  exit
fi

if [ $file_extension == 'txt' ]
then
  echo "Downloading metadata"
  value_keys=$(gsutil ls -L $1 |
    grep value_keys |
    jq -R 'split(":")|.[1] | fromjson')
  dimension_manifest=$(gsutil ls -L $1 |
    grep dimension_manifest |
    jq -R 'split(":")|.[1] | fromjson')
  total_data_points=$(gsutil ls -L $1 |
    grep total_data_points |
    jq -R 'split(":")|.[1] | fromjson')
  metadata="{\"value_keys\": ${value_keys//[[:blank:]]/}, \"dimension_manifest\": ${dimension_manifest//[[:blank:]]/}, \"total_data_points\": ${total_data_points//[[:blank:]]/}}"

  echo $metadata > apps/staff/server/core/demo_data/"$file_name".metadata.json
fi
