#!/bin/bash

# Generate Chrome extension icons from source image
# Usage: ./scripts/generate-icons.sh

set -e

SOURCE_IMAGE="samples/icon.jpg"
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
        magick "$SOURCE_IMAGE" -resize "${size}x${size}" -background none -gravity center -extent "${size}x${size}" "$OUTPUT_DIR/icon${size}.png"
        echo "Generated: $OUTPUT_DIR/icon${size}.png"
    done
elif command -v convert &> /dev/null; then
    # ImageMagick 6
    echo "Using ImageMagick (convert)..."
    for size in "${SIZES[@]}"; do
        convert "$SOURCE_IMAGE" -resize "${size}x${size}" -background none -gravity center -extent "${size}x${size}" "$OUTPUT_DIR/icon${size}.png"
        echo "Generated: $OUTPUT_DIR/icon${size}.png"
    done
elif command -v sips &> /dev/null; then
    # macOS built-in tool
    echo "Using sips (macOS)..."
    for size in "${SIZES[@]}"; do
        # sips requires copying first, then resizing
        cp "$SOURCE_IMAGE" "$OUTPUT_DIR/icon${size}.png"
        sips -z "$size" "$size" "$OUTPUT_DIR/icon${size}.png" --out "$OUTPUT_DIR/icon${size}.png" > /dev/null
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
