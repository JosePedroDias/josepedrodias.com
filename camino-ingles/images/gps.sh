#!/bin/bash

for image in *.jpg; do
    #exiftool -gpslatitude -gpslongitude -T "$image"
    exiftool -n -c '%.6f' -GPSPosition -T "$image"
done
