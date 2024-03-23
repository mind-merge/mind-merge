#!/bin/bash
echo "Current directory of script: $(pwd)"

# Check if a filename is provided
if [ -z "$1" ]
then
    echo "No markdown file provided"
    exit 1
fi

# Check if the file exists
if [ ! -f "$1" ]
then
    echo "File not found"
    exit 1
fi

# Check if a file to add is provided
if [ -z "$2" ]
then
    echo "No file to add provided"
    exit 1
fi

# Extract YAML front matter
front_matter=$(awk 'NR==1{if($0!="---"){exit}} /^---$/{c++;if(c==2){exit}} NR>1 {print}' "$1")
initial_front_matter="$front_matter"

# If front matter does not exist, create it
if [ -z "$initial_front_matter" ]
then
    front_matter=$(printf -- "referencedFiles:\n")
fi

# Check if referencedFiles exists and is an array, if not add it
if ! echo "$front_matter" | yq e 'has("referencedFiles")' - > /dev/null || ! echo "$front_matter" | yq e '.referencedFiles | kind == "seq"' - > /dev/null ; then
    front_matter=$(echo "$front_matter" | yq e '.referencedFiles = []' -)
fi

# Add new file to the referencedFiles array
updated_front_matter=$(echo "$front_matter" | yq e ".referencedFiles += [\"$2\"]" -)

# If the file had front matter, replace it. Otherwise, prepend it.
if [ -z "$initial_front_matter" ]
then
    echo -e "---\n$updated_front_matter\n---\n$(cat "$1")" > "$1"
else
    echo -e "---\n$updated_front_matter\n---\n$(cat "$1" | awk 'BEGIN {c=0} /^---$/ && c<2 {c++; next} c>=2 {print}' "$1")" > "$1"
fi

echo "File $2 added to $1 successfully"