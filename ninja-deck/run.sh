#!/bin/bash
set -e
cd "$(dirname "$0")"
NODE_PATH="$PWD/node_modules" node build.js
python3 animate.py ninja-raw.pptx ninja-presentation.pptx
rm -f ninja-raw.pptx
