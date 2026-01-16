import urllib.request
import json
import sys

job_id = "e315b9c2-58b4-4dc4-81d1-54a28ec93102"
url = f"http://localhost:8000/results/{job_id}"

try:
    with urllib.request.urlopen(url) as response:
        if response.status != 200:
            print(f"Error: Status {response.status}")
            sys.exit(1)
        
        data = response.read()
        json_data = json.loads(data)
        
        print("Heatmap in root:", "heatmap" in json_data)
        print("Explainability:", "explainability" in json_data)
        if "explainability" in json_data:
            print("Heatmap in explainability:", "heatmap" in json_data["explainability"])
            
        print("\nFull JSON:")
        print(json.dumps(json_data, indent=2))

except Exception as e:
    print(f"Error: {e}")
