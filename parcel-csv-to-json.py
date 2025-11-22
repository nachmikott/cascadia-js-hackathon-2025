import csv
import json

def csv_to_json(csv_file, json_file):
    result = {}
    with open(csv_file, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = row[reader.fieldnames[1]]  # use second column as key
            value = {col: row[col] for col in reader.fieldnames if col != reader.fieldnames[1]}
            result[key] = value

    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=4, ensure_ascii=False)

# Example usage:
csv_to_json("parcel-info.csv", "parcel-info.json")
