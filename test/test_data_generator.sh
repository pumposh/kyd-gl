#!/bin/bash

# Check if arguments are valid
if [ $# -eq 0 ]; then
    num_entries=40
    num_columns=5
elif [ $# -eq 1 ]; then
    if ! [[ $1 =~ ^[0-9]+$ ]]; then
        echo "Error: First argument must be a number"
        echo "Usage: $0 [number_of_entries] [number_of_columns]"
        exit 1
    fi
    num_entries=$1
    num_columns=5
else
    if ! [[ $1 =~ ^[0-9]+$ ]] || ! [[ $2 =~ ^[0-9]+$ ]]; then
        echo "Error: Both arguments must be numbers"
        echo "Usage: $0 [number_of_entries] [number_of_columns]"
        exit 1
    fi
    if [ $2 -lt 1 ]; then
        echo "Error: Number of columns must be at least 1"
        exit 1
    fi
    num_entries=$1
    num_columns=$2
fi

# Array of popular DJ artists
dj_artists=(
    "Skrillex" "Diplo" "Calvin_Harris" "Deadmau5" "Tiesto" "Zedd" "Martin_Garrix" 
    "David_Guetta" "Daft_Punk" "Avicii" "Swedish_House_Mafia" "Kygo" "Marshmello" 
    "The_Chainsmokers" "Illenium" "Flume" "Odesza" "Disclosure" "Fisher" "Carl_Cox"
)

# Get random DJ artist for file name
random_dj_idx=$((RANDOM % ${#dj_artists[@]}))
dj_name="${dj_artists[$random_dj_idx]}"
dj_name="${dj_name//_/ }"  # Replace underscores with spaces in DJ name

# Clear or create the file without header
file_name="data/${dj_name} (GLx${num_entries}).csv"

> "$file_name"

# Array of common first names (required)
first_names=(
    "Emma" "Liam" "Olivia" "Noah" "Ava" "Ethan" "Sophia" "Mason" 
    "Isabella" "William" "Mia" "James" "Charlotte" "Benjamin" "Amelia" 
    "Lucas" "Harper" "Henry" "Evelyn" "Alexander" "Abigail" "Michael" 
    "Emily" "Daniel" "Elizabeth" "Matthew" "Sofia" "Joseph" "Madison" 
    "David" "Avery" "Jackson" "Ella" "Sebastian" "Scarlett" "Jack" 
    "Victoria" "Owen" "Aria" "Luke"
)

# Optional data arrays
last_names=(
    "Smith" "Johnson" "Williams" "Brown" "Jones" "Garcia" "Miller" "Davis"
    "Rodriguez" "Martinez" "Hernandez" "Lopez" "Gonzalez" "Wilson" "Anderson"
    "Thomas" "Taylor" "Moore" "Jackson" "Martin" "Lee" "Perez" "Thompson"
    "White" "Harris" "Sanchez" "Clark" "Ramirez" "Lewis" "Robinson"
    "Walker" "Young" "Allen" "King" "Wright" "Scott" "Torres" "Nguyen"
    "Hill" "Flores"
)

notes=(
    "VIP Guest" "Plus One" "Artist Guest" "Industry Guest" "Media Pass"
    "Staff Guest" "Performer Guest" "Backstage Access" "Early Entry"
    "Meet & Greet" "" "" "" "" ""
)

# Generate random column order (first name is always included)
indices=(0)  # First name is always first
for ((i=1; i<num_columns; i++)); do
    indices+=($i)
done

# Shuffle the remaining indices
for ((i=${#indices[@]}-1; i>0; i--)); do
    j=$((RANDOM % (i+1)))
    temp=${indices[$i]}
    indices[$i]=${indices[$j]}
    indices[$j]=$temp
done

# Generate entries
for i in $(seq 1 $num_entries); do
    # Random indices for data
    first_idx=$((RANDOM % ${#first_names[@]}))
    last_idx=$((RANDOM % ${#last_names[@]}))
    notes_idx=$((RANDOM % ${#notes[@]}))
    tickets=$((RANDOM % 4 + 1))
    email="${first_names[$first_idx]:0:1}${last_names[$last_idx]}@example.com"
    email=$(echo "$email" | tr '[:upper:]' '[:lower:]')
    
    # Create array of possible values for each column
    values=()
    values[0]="${first_names[$first_idx]}"  # First name is required
    values[1]="${last_names[$last_idx]}"
    values[2]="$tickets"
    values[3]="$email"
    values[4]="${notes[$notes_idx]}"
    
    # Build the line using the column order
    line=""
    for idx in "${indices[@]}"; do
        if [ -n "$line" ]; then
            line="$line,"
        fi
        # Only include value if we have data for this column index
        if [ $idx -lt ${#values[@]} ]; then
            line="$line${values[$idx]}"
        fi
    done
    
    # Add any remaining commas for unused columns
    remaining_commas=$((num_columns - ${#indices[@]}))
    for ((j=0; j<remaining_commas; j++)); do
        line="$line,"
    done
    
    echo "$line" >> "$file_name"
done

echo "Generated '$file_name' with $num_entries entries and $num_columns columns" 