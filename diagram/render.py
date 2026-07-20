import os
import sys
import zlib
import base64
import string
import urllib.request
import urllib.error

def plantuml_encode(plantuml_text):
    """Compresses and encodes PlantUML text for the PlantUML server."""
    # 1. UTF-8 encode
    utf8_bytes = plantuml_text.encode('utf-8')
    # 2. Compress using zlib
    zlibbed_bytes = zlib.compress(utf8_bytes)
    # 3. Strip zlib header (2 bytes) and checksum (4 bytes) to get raw deflate
    raw_deflate = zlibbed_bytes[2:-4]
    # 4. Base64 encode
    b64_str = base64.b64encode(raw_deflate).decode('utf-8')
    # 5. Translate base64 standard alphabet to PlantUML custom alphabet
    plantuml_alphabet = string.digits + string.ascii_uppercase + string.ascii_lowercase + '-_'
    base64_alphabet = string.ascii_uppercase + string.ascii_lowercase + string.digits + '+/'
    translation_table = str.maketrans(base64_alphabet, plantuml_alphabet)
    return b64_str.translate(translation_table).rstrip('=')

def render_file(file_path, output_dir=None, format_ext='png'):
    """Renders a single .uml file to an image using the PlantUML online server."""
    if not os.path.exists(file_path):
        print(f"[ERROR] File does not exist: {file_path}")
        return False
        
    print(f"Reading {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"[ERROR] Failed to read {file_path}: {e}")
        return False

    # Check for PlantUML tags, or wrap the content if missing
    if "@startuml" not in content:
        content = "@startuml\n" + content + "\n@enduml"

    encoded = plantuml_encode(content)
    url = f"https://www.plantuml.com/plantuml/{format_ext}/{encoded}"
    
    # Determine output file name
    base_name = os.path.splitext(os.path.basename(file_path))[0]
    if not output_dir:
        output_dir = os.path.dirname(os.path.abspath(file_path))
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{base_name}.{format_ext}")


    print(f"Downloading rendered image to {output_path}...")
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            image_data = response.read()
        
        with open(output_path, 'wb') as f:
            f.write(image_data)
        print(f"[SUCCESS] Rendered: {output_path}")
        return True
    except urllib.error.HTTPError as e:
        print(f"[ERROR] HTTP Error {e.code} for {file_path}: {e.reason}")
    except urllib.error.URLError as e:
        print(f"[ERROR] URL Error for {file_path}: {e.reason}")
    except Exception as e:
        print(f"[ERROR] General exception while rendering {file_path}: {e}")
    return False

def render_all(directory, format_ext='png'):
    """Renders all .uml files in the directory."""
    print(f"Searching for .uml files in: {directory}")
    uml_files = [f for f in os.listdir(directory) if f.endswith('.uml')]
    if not uml_files:
        print("No .uml files found in the directory.")
        return

    success_count = 0
    fail_count = 0
    print(f"Found {len(uml_files)} UML files to render.")
    print("=" * 60)
    
    for f in uml_files:
        full_path = os.path.join(directory, f)
        if render_file(full_path, format_ext=format_ext):
            success_count += 1
        else:
            fail_count += 1
        print("-" * 60)

    print(f"\nRender process completed. Success: {success_count}, Failed: {fail_count}")

if __name__ == '__main__':
    # Default to current script directory if no arguments passed
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Check arguments
    format_ext = 'png'
    # Optional SVG format support
    if '--svg' in sys.argv:
        format_ext = 'svg'
        sys.argv.remove('--svg')

    if len(sys.argv) > 1:
        target = sys.argv[1]
        if os.path.isdir(target):
            render_all(target, format_ext)
        elif os.path.isfile(target):
            render_file(target, format_ext=format_ext)
        else:
            print(f"[ERROR] Target not found: {target}")
    else:
        render_all(script_dir, format_ext)
