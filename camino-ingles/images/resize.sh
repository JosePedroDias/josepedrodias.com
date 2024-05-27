#!/bin/bash

for image in *.jpg; do
    magick "$image" -resize '512x512>' "$image"
done
