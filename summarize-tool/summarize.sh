#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

# Configuration - Output file relative to the script directory
OUTPUT_FILE="$SCRIPT_DIR/summarize.txt"
IGNORE_FILE="$SCRIPT_DIR/.summarizeignore"

# Get project root (parent of script directory)
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")

# Change to project root so we can scan everything from the top down
cd "$PROJECT_ROOT" || exit 1

# Initialize variables
FILES_TO_DUMP=()

# Create a default ignore file if it doesn't exist
if [[ ! -f "$IGNORE_FILE" ]]; then
    cat <<EOT > "$IGNORE_FILE"
node_modules
.git
.DS_Store
package-lock.json
*.jpg
*.png
*.ico
$OUTPUT_FILE
$IGNORE_FILE
EOT
    echo "Created default $IGNORE_FILE"
fi

# Read ignore patterns into an array (remove empty lines and comments)
readarray -t IGNORE_PATTERNS < <(grep -v '^#' "$IGNORE_FILE" | grep -v '^[[:space:]]*$' | sed 's/[[:space:]]*$//')

# Function to check if a file/folder should be ignored
is_ignored() {
    local path="$1"
    local base=$(basename "$path")
    
    for pat in "${IGNORE_PATTERNS[@]}"; do
        # Skip empty patterns
        [[ -z "$pat" ]] && continue
        
        # Strip trailing slash from pattern for matching
        local clean_pat="${pat%/}"
        
        # Handle glob patterns with wildcards
        if [[ "$clean_pat" == *"*" || "$clean_pat" == *"?" ]]; then
            # For wildcard patterns, use bash globbing
            if [[ "$base" == $clean_pat ]] || [[ "$path" == */$clean_pat ]] || [[ "$path" == $clean_pat/* ]]; then
                return 0
            fi
        else
            # Exact match for non-wildcard patterns
            if [[ "$path" == "$clean_pat" ]] || [[ "$path" == */"$clean_pat" ]] || [[ "$base" == "$clean_pat" ]]; then
                return 0
            fi
        fi
    done
    return 1 # Not ignored
}

# Recursive function to build the tree and collect files
walk_dir() {
    local dir="$1"
    local indent="$2"
    local is_root="$3"

    # Use nullglob and dotglob to catch hidden files and prevent literal '*' if empty
    local prev_shopt=$(shopt -p nullglob dotglob)
    shopt -s nullglob dotglob

    local items=("$dir"/*)
    
    eval "$prev_shopt" # Restore shopt settings

    for item in "${items[@]}"; do
        local base=$(basename "$item")
        local rel_path=${item#./} # Remove leading ./

        # Always skip current and parent directory markers
        [[ "$base" == "." || "$base" == ".." ]] && continue

        # Check against ignore list
        if is_ignored "$rel_path"; then
            continue
        fi

        if [[ -d "$item" ]]; then
            if [[ "$is_root" == true ]]; then
                echo "${base}/" >> "$OUTPUT_FILE"
                walk_dir "$item" "" false
            else
                echo "${indent} ${base}/" >> "$OUTPUT_FILE"
                walk_dir "$item" "  $indent" false
            fi
        elif [[ -f "$item" ]] && [[ "$rel_path" != "$OUTPUT_FILE" ]]; then
            FILES_TO_DUMP+=("$item")
            if [[ "$is_root" == true ]]; then
                echo "${base}" >> "$OUTPUT_FILE"
            else
                echo "${indent} - ${base}" >> "$OUTPUT_FILE"
            fi
        fi
    done
}

# --- START SCRIPT ---

echo "Generating project structure..."
> "$OUTPUT_FILE" # Clear output file
echo "PROJECT STRUCTURE:" >> "$OUTPUT_FILE"

# Start walking from current directory
walk_dir "." "" true

echo -e "\nCODE:" >> "$OUTPUT_FILE"

echo "Extracting code from files..."
for file in "${FILES_TO_DUMP[@]}"; do
    base=$(basename "$file")
    ext="${base##*.}"
    
    # If the file has no extension, leave ext blank
    [[ "$base" == "$ext" ]] && ext=""

    # Optional: Skip binary files automatically using the 'file' command
    if file -b --mime-encoding "$file" | grep -q "binary"; then
        echo "Skipping binary file: $base"
        continue
    fi

    echo "$base" >> "$OUTPUT_FILE"
    echo '```'"$ext" >> "$OUTPUT_FILE"
    
    # Append file contents
    cat "$file" >> "$OUTPUT_FILE"
    
    # Ensure there is a newline before the closing backticks
    # (in case the source file doesn't end with an empty line)
    [[ $(tail -c1 "$file" | wc -l) -eq 0 ]] && echo "" >> "$OUTPUT_FILE"
    
    echo '```' >> "$OUTPUT_FILE"
done

echo "Done! Output saved to $OUTPUT_FILE"