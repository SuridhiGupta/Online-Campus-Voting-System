import json
import fnmatch

filepath = r"C:\Users\surid\.gemini\antigravity\brain\46f5a426-1c5d-4dc9-b9e4-6999b51f9b96\.system_generated\logs\overview.txt"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

latest_versions = {}
current_tool = ""
current_content = []
recording = False

# We will just print lines that contain 'ManageStudents.jsx' or 'ManageCandidates.jsx' or 'Results.jsx'
# Actually, since it's a transcript, let's just grep for "write_to_file" and "TargetFile" in the log
import re

for i, line in enumerate(lines):
    if "ManageCandidates.jsx" in line or "ManageStudents.jsx" in line or "Results.jsx" in line or "AdminLayout.jsx" in line or "ElectionControl.jsx" in line:
        print(f"Line {i}: {line.strip()[:200]}")

