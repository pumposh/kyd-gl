# Test Data Generator

A simple tool to generate test CSV files for guest lists.

## Usage

```bash
./test_data_generator.sh [number_of_entries] [number_of_columns]
```

- `number_of_entries`: Number of guests to generate (default: 40)
- `number_of_columns`: Number of columns in the CSV (default: 5)

## Examples

```bash
# Generate default size (40 guests, 5 columns)
./test_data_generator.sh

# Generate 100 guests
./test_data_generator.sh 100

# Generate 1000 guests with 3 columns
./test_data_generator.sh 1000 3
```

## Output

The script generates a CSV file in the `test/data` directory with:
- Random DJ artist name in the filename
- Required first name column
- Optional columns: last name, number of tickets, email, notes
- Randomized column order (except first name which is always included)

Example output: `The Chainsmokers (GLx60).csv` for 60 guests
