import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8', errors='ignore')

SRC_DIR = r"d:\Work_Code_22_26\SEP490\Homestay_Management_System\frontendHomestayManagement\src"

# Files to skip (Landing 3D)
SKIP_FILES = ["LandingPage.jsx", "LandingPage.css", "LandingRoomCard.jsx"]

count_files_modified = 0

for root, dirs, files in os.walk(SRC_DIR):
    for file in files:
        if file in SKIP_FILES:
            continue
        if file.endswith(".css") or file.endswith(".jsx"):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            original = content

            # 1. Standardize font overrides
            content = re.sub(r'font-family:\s*(?:Georgia|\'Times New Roman\'|"Times New Roman"|Times|serif)[^;]*;', 
                             "font-family: var(--font-heading);", content)
            content = re.sub(r'font-family:\s*[\'"]?Playfair Display[\'"]?[^;]*;', 
                             "font-family: var(--font-heading);", content)
            content = re.sub(r'font-family:\s*[\'"]?Cormorant Garamond[\'"]?[^;]*;', 
                             "font-family: var(--font-heading);", content)

            # 2. Standardize #ff385c / #e00b41 / #ffd1da to Brand Theme (#1e3a2b / #c2410c)
            # Replace Airbnb pink borders/backgrounds
            content = content.replace("#ff385c", "#1e3a2b")
            content = content.replace("#e00b41", "#166534")
            content = content.replace("#ffd1da", "#dcfce7")
            content = content.replace("#fff0f3", "#f0fdf4")
            content = content.replace("#fff5f7", "#f8fafc")

            if content != original:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                count_files_modified += 1
                print(f"✓ Unified: {os.path.relpath(file_path, SRC_DIR)}")

print(f"\n🎉 Total files unified: {count_files_modified}")
