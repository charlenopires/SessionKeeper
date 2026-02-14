#!/bin/bash

# Generate Chrome extension icons from source image
# Usage: ./scripts/generate-icons.sh

set -e

SOURCE_IMAGE="samples/icon.svg"
OUTPUT_DIR="public/icons"
SIZES=(16 48 128)

# Check if source image exists
if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "Error: Source image not found: $SOURCE_IMAGE"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check for available image processing tool
if command -v magick &> /dev/null; then
    # ImageMagick 7+
    echo "Using ImageMagick..."
    for size in "${SIZES[@]}"; do
        magick -background none -density 256 "$SOURCE_IMAGE" -resize "${size}x${size}" -gravity center -extent "${size}x${size}" "$OUTPUT_DIR/icon${size}.png"
        echo "Generated: $OUTPUT_DIR/icon${size}.png"
    done
elif command -v convert &> /dev/null; then
    # ImageMagick 6
    echo "Using ImageMagick (convert)..."
    for size in "${SIZES[@]}"; do
        convert -background none -density 256 "$SOURCE_IMAGE" -resize "${size}x${size}" -gravity center -extent "${size}x${size}" "$OUTPUT_DIR/icon${size}.png"
        echo "Generated: $OUTPUT_DIR/icon${size}.png"
    done
elif command -v rsvg-convert &> /dev/null; then
    # librsvg (brew install librsvg)
    echo "Using rsvg-convert..."
    for size in "${SIZES[@]}"; do
        rsvg-convert -w "$size" -h "$size" "$SOURCE_IMAGE" -o "$OUTPUT_DIR/icon${size}.png"
        echo "Generated: $OUTPUT_DIR/icon${size}.png"
    done
else
    echo "Error: No image processing tool found."
    echo "Please install ImageMagick: brew install imagemagick"
    exit 1
fi

echo ""
echo "Icons generated successfully in $OUTPUT_DIR/"
ls -la "$OUTPUT_DIR"
