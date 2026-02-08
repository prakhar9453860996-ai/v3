import json
import sys

try:
    with open('plant_disease.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
except Exception as e:
    print(f"Error reading file: {e}")
    sys.exit(1)

missing = []
for index, item in enumerate(data):
    if not item.get('name_hi') or not item.get('cause_hi') or not item.get('cure_hi'):
        entry = {
            'index': index,
            'name': item.get('name', 'Unknown'),
            'missing_fields': []
        }
        if not item.get('name_hi'): entry['missing_fields'].append('name_hi')
        if not item.get('cause_hi'): entry['missing_fields'].append('cause_hi')
        if not item.get('cure_hi'): entry['missing_fields'].append('cure_hi')
        missing.append(entry)

if not missing:
    print(f"All {len(data)} entries have Hindi translations.")
else:
    print(f"Missing translations for {len(missing)} entries:")
    print(json.dumps(missing, indent=2, ensure_ascii=False))
