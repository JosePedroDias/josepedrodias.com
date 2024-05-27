#!/bin/bash

exiftool '-filename<${datetimeoriginal}' -d "%Y%m%dT%H%M%S%%-c.%%e" *.jpg
