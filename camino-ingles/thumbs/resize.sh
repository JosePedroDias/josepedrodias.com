#!/bin/bash

for image in *.jpg; do
    magick "$image" -resize '52x52>' "$image"
done
