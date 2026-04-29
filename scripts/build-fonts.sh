#!/usr/bin/env bash
# Subset and convert fonts to WOFF2 + WOFF.
# Requirements: pyftsubset (fonttools) + brotli (Python ext) for WOFF2.
# Run on a developer machine; output is committed to public/fonts/.
#
#   pip install fonttools brotli
#   ./scripts/build-fonts.sh

set -euo pipefail
cd "$(dirname "$0")/../public/fonts"

LATIN_RANGES="U+0020-007F,U+00A0-024F,U+1E00-1EFF,U+2010-205E,U+2070-209F,U+20A0-20BF,U+2122,U+2190-21FF"
CYRILLIC_RANGES="U+0400-04FF,U+0500-052F"
LATIN_CYRILLIC="$LATIN_RANGES,$CYRILLIC_RANGES"

subset() {
  local input="$1" output="$2" ranges="$3" flavor="$4"
  pyftsubset "$input" \
    --output-file="$output" \
    --flavor="$flavor" \
    --unicodes="$ranges" \
    --layout-features='kern,liga,calt' \
    --no-hinting \
    --desubroutinize \
    --drop-tables+=DSIG,JSTF
  local before after pct
  before=$(stat -c%s "$input")
  after=$(stat -c%s "$output")
  pct=$(( 100 - 100 * after / before ))
  printf "  %-44s  %4dKB → %4dKB  (-%d%%)\n" "$(basename "$output")" $((before/1024)) $((after/1024)) "$pct"
}

build_pair() {
  local input="$1" base="$2" ranges="$3"
  subset "$input" "${base}.woff"  "$ranges" woff
  subset "$input" "${base}.woff2" "$ranges" woff2 || \
    echo "  (woff2 skipped — install brotli to enable)"
}

echo "=== Subsetting fonts ==="
build_pair Gloock-Regular.ttf             Gloock-Regular             "$LATIN_RANGES"
build_pair BricolageGrotesque-Regular.ttf BricolageGrotesque-Regular "$LATIN_RANGES"
build_pair BricolageGrotesque-Bold.ttf    BricolageGrotesque-Bold    "$LATIN_RANGES"
build_pair CrimsonPro-Regular.ttf         CrimsonPro-Regular         "$LATIN_RANGES"
build_pair CrimsonPro-Italic.ttf          CrimsonPro-Italic          "$LATIN_RANGES"
build_pair JetBrainsMono-Regular.ttf      JetBrainsMono-Regular      "$LATIN_CYRILLIC"
build_pair JetBrainsMono-Bold.ttf         JetBrainsMono-Bold         "$LATIN_CYRILLIC"

echo ""
echo "=== Done. Commit the resulting .woff and .woff2 alongside originals. ==="
