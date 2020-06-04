import csv
import json

zip_codes = {}

with open('uscities.csv', 'r') as f:
    cityData = csv.reader(f, delimiter=",", quotechar='"')
    for row in cityData:
        zips = row[17].split()
        for zip in zips:
            zip_codes[zip] = [row[8], row[9]]

zip_codes.pop('zips')

with open('zipCodes.json', 'w') as f:
    f.write(json.dumps(zip_codes))
