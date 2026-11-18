#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

extensions=('*.ts' '*.tsx' '*.js' '*.mjs' '*.css' '*.scss' '*.yml' '*.yaml' '*.html')

added_lines() {
  git diff HEAD --unified=0 --no-color -- "${extensions[@]}"
  git ls-files -z --others --exclude-standard -- "${extensions[@]}" |
    while IFS= read -r -d '' file; do
      git diff --no-index --unified=0 --no-color -- /dev/null "$file" || true
    done
}

comments=$(
  added_lines |
    awk '
      /^\+\+\+ / {
        file = substr($0, 7)
        ext = file; sub(/.*\./, "", ext)
        hash = ext ~ /^(yml|yaml)$/
        markup = ext == "html"
        next
      }
      /^@@/ { split($3, a, ","); line = substr(a[1], 2) + 0; next }
      /^\+/ {
        text = substr($0, 2)
        if (hash) {
          found = text ~ /^[[:space:]]*#[^!]/ || text ~ /^[[:space:]]*#$/ || text ~ /[[:space:]]#[[:space:]]/
        } else {
          found = text ~ /^[[:space:]]*(\/\/|\/\*|\*|\{\/\*)/ || text ~ /[[:space:]](\/\/|\/\*)/
        }
        if (markup) found = found || text ~ /<!--/
        pragma = text ~ /(noqa|type: *ignore|pylint:|eslint-|oxlint-|@ts-|prettier-ignore|istanbul|biome-ignore|https?:\/\/)/
        if (found && !pragma) {
          sub(/^[[:space:]]+/, "", text)
          printf "%s:%d: %s\n", file, line, text
        }
        line++
      }
    '
)

if [[ -z "$comments" ]]; then
  echo "No comment lines added."
  exit 0
fi

printf 'Comment lines added:\n\n%s\n\n' "$comments"
echo "AGENTS.md §13: keep only the comments a reader of the code alone would get wrong; delete the rest."
