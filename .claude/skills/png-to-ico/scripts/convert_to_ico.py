#!/usr/bin/env python3
"""
PNG to ICO Converter Script
Converts PNG images to ICO format with various size presets
"""

import sys
import os
import json
import argparse
from pathlib import Path
from typing import List, Dict, Tuple

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow library not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow>=10.0.0"])
    from PIL import Image

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def load_presets(preset_file: Path = None) -> Dict:
    """Load size presets from JSON file"""
    if preset_file is None:
        # Default preset file location
        script_dir = Path(__file__).parent.parent
        preset_file = script_dir / "presets.json"

    if not preset_file.exists():
        # Return default presets if file doesn't exist
        return get_default_presets()

    with open(preset_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_default_presets() -> Dict:
    """Return default size presets"""
    return {
        "windows": {
            "sizes": [256, 128, 64, 48, 32, 16],
            "description": "Windows application icons (.ico)",
            "target_sizes_kb": [50, 30, 10, 8, 5, 2]
        },
        "macos": {
            "sizes": [1024, 512, 256, 128, 64, 32],
            "description": "macOS application icons",
            "target_sizes_kb": [300, 200, 100, 60, 40, 20]
        },
        "web": {
            "sizes": [48, 32, 16],
            "description": "Web favicons",
            "target_sizes_kb": [20, 15, 5]
        },
        "pwa": {
            "sizes": [512, 192],
            "description": "Progressive Web App icons",
            "target_sizes_kb": [200, 80]
        },
        "chrome-ext": {
            "sizes": [128, 48, 32, 16],
            "description": "Chrome extension icons",
            "target_sizes_kb": [60, 20, 15, 5]
        },
        "ios": {
            "sizes": [1024, 180, 152, 167, 120, 80],
            "description": "iOS app icons",
            "target_sizes_kb": [400, 80, 50, 50, 50, 30]
        },
        "android": {
            "sizes": [192, 144, 96, 72, 48],
            "description": "Android app icons",
            "target_sizes_kb": [80, 60, 40, 30, 20]
        },
        "ui": {
            "sizes": [48, 32, 24],
            "description": "UI toolbar icons",
            "target_sizes_kb": [20, 15, 10]
        },
        "all": {
            "sizes": [1024, 512, 256, 192, 180, 167, 152, 144, 128, 120, 96, 80, 72, 64, 48, 32, 24, 16],
            "description": "All common icon sizes",
            "target_sizes_kb": [400, 200, 100, 80, 80, 50, 50, 60, 60, 50, 40, 30, 30, 40, 20, 15, 10, 5]
        }
    }

def validate_input_image(image_path: Path) -> Tuple[bool, str, Image.Image]:
    """Validate input PNG file"""
    if not image_path.exists():
        return False, f"File not found: {image_path}", None

    if not image_path.suffix.lower() in ['.png', '.jpg', '.jpeg']:
        return False, f"Input must be PNG or JPG file, got: {image_path.suffix}", None

    try:
        img = Image.open(image_path)
        width, height = img.size

        if width < 16 or height < 16:
            return False, f"Image too small ({width}×{height}). Minimum 16×16 required.", None

        if width != height:
            print(f"{Colors.WARNING}Warning: Image is not square ({width}×{height}). Will be resized with aspect ratio preserved.{Colors.ENDC}")

        # Convert to RGBA if necessary
        if img.mode != 'RGBA':
            print(f"{Colors.OKBLUE}Converting image to RGBA mode...{Colors.ENDC}")
            img = img.convert('RGBA')

        return True, "Valid", img
    except Exception as e:
        return False, f"Failed to open image: {str(e)}", None

def resize_image(img: Image.Image, size: int) -> Image.Image:
    """Resize image to specified size with high quality"""
    # Use LANCZOS for high-quality downsampling
    return img.resize((size, size), Image.Resampling.LANCZOS)

def convert_to_ico(input_path: Path, preset_name: str, output_dir: Path, custom_sizes: List[int] = None) -> Dict:
    """
    Main conversion function
    Returns dict with conversion results
    """
    # Load presets
    presets = load_presets()

    # Determine sizes to generate
    if custom_sizes:
        sizes = sorted(custom_sizes, reverse=True)
        preset_name = "custom"
        description = "Custom sizes"
    elif preset_name in presets:
        sizes = presets[preset_name]["sizes"]
        description = presets[preset_name]["description"]
    else:
        return {
            "success": False,
            "error": f"Unknown preset: {preset_name}. Available: {', '.join(presets.keys())}"
        }

    # Validate input
    valid, message, img = validate_input_image(input_path)
    if not valid:
        return {"success": False, "error": message}

    print(f"\n{Colors.HEADER}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}PNG to ICO Conversion{Colors.ENDC}")
    print(f"{Colors.HEADER}{'='*60}{Colors.ENDC}\n")
    print(f"{Colors.OKBLUE}Input:{Colors.ENDC} {input_path}")
    print(f"{Colors.OKBLUE}Preset:{Colors.ENDC} {preset_name} - {description}")
    print(f"{Colors.OKBLUE}Sizes:{Colors.ENDC} {', '.join(f'{s}×{s}' for s in sizes)}")
    print(f"{Colors.OKBLUE}Output:{Colors.ENDC} {output_dir}\n")

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)

    # Create preset-specific subdirectory
    preset_output_dir = output_dir / preset_name
    preset_output_dir.mkdir(parents=True, exist_ok=True)

    results = {
        "success": True,
        "input": str(input_path),
        "preset": preset_name,
        "description": description,
        "output_dir": str(preset_output_dir),
        "files": []
    }

    # Generate icons for each size
    print(f"{Colors.OKGREEN}Generating icons...{Colors.ENDC}\n")

    for size in sizes:
        try:
            # Resize image
            resized_img = resize_image(img, size)

            # Generate output filename
            base_name = input_path.stem
            output_filename = f"{base_name}_{size}x{size}.ico"
            output_path = preset_output_dir / output_filename

            # Save as ICO
            resized_img.save(output_path, format='ICO')

            # Get file size
            file_size_bytes = output_path.stat().st_size
            file_size_kb = file_size_bytes / 1024

            # Also save as PNG for reference
            png_filename = f"{base_name}_{size}x{size}.png"
            png_path = preset_output_dir / png_filename
            resized_img.save(png_path, format='PNG', optimize=True)

            print(f"  {Colors.OKGREEN}✓{Colors.ENDC} {size}×{size}: {output_filename} ({file_size_kb:.1f} KB)")

            results["files"].append({
                "size": f"{size}×{size}",
                "ico_file": output_filename,
                "png_file": png_filename,
                "file_size_kb": round(file_size_kb, 1),
                "path": str(output_path)
            })

        except Exception as e:
            print(f"  {Colors.FAIL}✗{Colors.ENDC} {size}×{size}: Failed - {str(e)}")
            results["files"].append({
                "size": f"{size}×{size}",
                "error": str(e)
            })

    # Generate manifest
    manifest_path = preset_output_dir / "manifest.json"
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n{Colors.OKGREEN}✓ Conversion complete!{Colors.ENDC}")
    print(f"{Colors.OKBLUE}Generated {len([f for f in results['files'] if 'error' not in f])} icons{Colors.ENDC}")
    print(f"{Colors.OKBLUE}Output directory:{Colors.ENDC} {preset_output_dir}")
    print(f"{Colors.OKBLUE}Manifest:{Colors.ENDC} {manifest_path}\n")

    return results

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Convert PNG images to ICO format with various size presets',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --input logo.png --preset windows
  %(prog)s --input icon.png --preset pwa --output ./icons
  %(prog)s --input app.png --sizes 64 128 256
  %(prog)s --input favicon.png --preset web
        """
    )

    parser.add_argument('--input', '-i', type=str, required=True,
                        help='Input PNG file path')
    parser.add_argument('--preset', '-p', type=str, default='windows',
                        help='Size preset (windows, macos, web, pwa, chrome-ext, ios, android, ui, all)')
    parser.add_argument('--output', '-o', type=str, default='./output/icons',
                        help='Output directory (default: ./output/icons)')
    parser.add_argument('--sizes', '-s', type=int, nargs='+',
                        help='Custom sizes (e.g., --sizes 64 128 256)')
    parser.add_argument('--list-presets', action='store_true',
                        help='List available presets and exit')

    args = parser.parse_args()

    # List presets if requested
    if args.list_presets:
        presets = load_presets()
        print(f"\n{Colors.HEADER}Available Presets:{Colors.ENDC}\n")
        for name, config in presets.items():
            sizes_str = ', '.join(f"{s}×{s}" for s in config['sizes'])
            print(f"  {Colors.OKGREEN}{name}{Colors.ENDC}: {config['description']}")
            print(f"    Sizes: {sizes_str}\n")
        return 0

    # Convert paths
    input_path = Path(args.input).resolve()
    output_dir = Path(args.output).resolve()

    # Perform conversion
    result = convert_to_ico(
        input_path=input_path,
        preset_name=args.preset,
        output_dir=output_dir,
        custom_sizes=args.sizes
    )

    if not result["success"]:
        print(f"{Colors.FAIL}Error: {result['error']}{Colors.ENDC}")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())
