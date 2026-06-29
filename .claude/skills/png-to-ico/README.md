# PNG to ICO Converter Skill

A comprehensive Claude Code skill for converting PNG images to ICO format with predefined size presets for various platforms and use cases.

## Features

- **Multiple Platform Presets**: Windows, macOS, web, PWA, Chrome extensions, iOS, Android
- **Batch Conversion**: Generate multiple icon sizes in one command
- **High Quality**: Uses Pillow's LANCZOS resampling for best quality
- **Auto-organization**: Creates organized output directories by preset
- **Metadata Generation**: JSON manifest for tracking conversions
- **Dual Output**: Both ICO and PNG formats for flexibility

## Installation

### Prerequisites

- Python 3.7 or higher
- Pillow library (auto-installs if missing)

### Setup

1. The skill is already installed in your `.claude/skills/` directory
2. Dependencies will be automatically installed on first use
3. Manual installation (if needed):
   ```bash
   pip install Pillow>=10.0.0
   ```

## Usage

### Using the Skill in Claude Code

Simply invoke the skill in Claude Code:

```
Use png-to-ico skill to convert my logo.png to Windows icons
```

Claude will guide you through:
1. Confirming the input PNG file path
2. Selecting a preset (or custom sizes)
3. Setting the output directory
4. Executing the conversion

### Direct Command Line Usage

You can also run the conversion script directly:

```bash
# Basic usage with preset
python .claude/skills/png-to-ico/scripts/convert_to_ico.py --input logo.png --preset windows

# Custom output directory
python .claude/skills/png-to-ico/scripts/convert_to_ico.py --input icon.png --preset pwa --output ./my-icons

# Custom sizes
python .claude/skills/png-to-ico/scripts/convert_to_ico.py --input app.png --sizes 64 128 256

# List all available presets
python .claude/skills/png-to-ico/scripts/convert_to_ico.py --list-presets
```

## Available Presets

| Preset | Sizes | Description |
|--------|-------|-------------|
| `windows` | 256, 128, 64, 48, 32, 16 | Windows application icons (.ico) |
| `macos` | 1024, 512, 256, 128, 64, 32 | macOS application icons (.icns) |
| `web` | 48, 32, 16 | Web favicons |
| `pwa` | 512, 192 | Progressive Web App icons |
| `chrome-ext` | 128, 48, 32, 16 | Chrome extension icons |
| `ios` | 1024, 180, 167, 152, 120, 80 | iOS app icons |
| `android` | 192, 144, 96, 72, 48 | Android app icons |
| `ui` | 48, 32, 24 | UI toolbar icons |
| `apple-touch` | 180 | Apple Touch Icon |
| `android-adaptive` | 108 | Android Adaptive Icon layers |
| `splash` | 2732, 1920, 1080 | Splash screen illustrations |
| `illustration` | 800 | UI illustrations |
| `all` | 23 sizes | All common sizes across platforms |
| `minimal` | 256, 128, 64, 32, 16 | Minimal essential set |
| `favicon-complete` | 180, 192, 512, 48, 32, 16 | Complete favicon + PWA |

## Size Reference Table

### Windows App Icons (.ico)

| Size | Use Case | Target File Size |
|------|----------|------------------|
| 256×256 | High-resolution main icon | 50–200 KB |
| 128×128 | High-resolution backup | 30–80 KB |
| 64×64 | Explorer general icon | 10–40 KB |
| 48×48 | Quick access | 8–30 KB |
| 32×32 | System small icon | 5–20 KB |
| 16×16 | Minimum icon size | 2–10 KB |

### macOS App Icons (.icns)

| Size | Use Case | Target File Size |
|------|----------|------------------|
| 1024×1024 | App Store / Launchpad | 100–300 KB |
| 512×512 | Finder high-res | 80–200 KB |
| 256×256 | Finder standard | 40–100 KB |
| 128×128 | Finder medium | 20–60 KB |
| 64×64 | Toolbar | 10–40 KB |
| 32×32 | Small icon | 5–20 KB |

### Web / Browser

| Size | Use Case | Target File Size |
|------|----------|------------------|
| 16×16 | Basic favicon | <5 KB |
| 32×32 | Standard favicon | 5–15 KB |
| 48×48 | High-res favicon | 10–20 KB |
| 180×180 | Apple Touch Icon (iOS home) | 20–50 KB |
| 192×192 | PWA Android home screen | 30–80 KB |
| 512×512 | PWA high-resolution | 100–200 KB |

### Chrome Extension Icons

| Size | Use Case | Target File Size |
|------|----------|------------------|
| 16×16 | Browser Action small | <5 KB |
| 32×32 | Toolbar | 5–15 KB |
| 48×48 | Management page | 10–20 KB |
| 128×128 | Web Store main icon | 20–60 KB |

### iOS App Icons

| Size | Use Case | Target File Size |
|------|----------|------------------|
| 1024×1024 | App Store main (most important) | 200–400 KB |
| 180×180 | iPhone home @3x | 30–80 KB |
| 120×120 | iPhone home @2x | 20–50 KB |
| 167×167 | iPad Pro home | 20–50 KB |
| 152×152 | iPad home | 20–50 KB |
| 80×80 | Spotlight | 10–30 KB |

### Android App Icons

| Size | Use Case | Target File Size |
|------|----------|------------------|
| 192×192 | xxxhdpi | 30–80 KB |
| 144×144 | xxhdpi | 20–60 KB |
| 96×96 | xhdpi | 10–40 KB |
| 72×72 | hdpi | 10–30 KB |
| 48×48 | mdpi | 5–20 KB |
| 108×108 | Adaptive icon layers | 10–40 KB |

## Output Structure

After conversion, your output directory will look like:

```
output/icons/
└── windows/                    # Preset name
    ├── logo_256x256.ico       # ICO format
    ├── logo_256x256.png       # PNG reference
    ├── logo_128x128.ico
    ├── logo_128x128.png
    ├── logo_64x64.ico
    ├── logo_64x64.png
    ├── logo_48x48.ico
    ├── logo_48x48.png
    ├── logo_32x32.ico
    ├── logo_32x32.png
    ├── logo_16x16.ico
    ├── logo_16x16.png
    └── manifest.json          # Conversion metadata
```

## Best Practices

### Input Image Guidelines

1. **Resolution**: Use at least 1024×1024 PNG for best quality
2. **Format**: PNG with alpha channel (transparency)
3. **Design**: Simple, clear graphics work best at small sizes
4. **Square**: Images should ideally be square (1:1 aspect ratio)
5. **Testing**: Always test smallest sizes (16×16, 32×32) for clarity

### Platform-Specific Tips

#### Windows
- Include all 6 standard sizes for complete compatibility
- Test on different Windows versions (10, 11)
- Ensure 256×256 looks good as it's the main display size

#### macOS
- 1024×1024 is mandatory for App Store
- Keep designs simple as macOS applies its own effects
- Test in both light and dark modes

#### Web Favicons
- Provide 16×16, 32×32, and 48×48 at minimum
- Consider adding 180×180 for iOS devices
- Use simple, recognizable designs at 16×16

#### Mobile Apps
- iOS requires 1024×1024 for App Store submission
- Android uses adaptive icons (108×108 layers)
- Test on actual devices for best results

## Examples

### Example 1: Windows Application

```bash
python convert_to_ico.py --input MyApp.png --preset windows
```

Output:
```
✓ 256×256: MyApp_256x256.ico (45.2 KB)
✓ 128×128: MyApp_128x128.ico (28.1 KB)
✓ 64×64: MyApp_64x64.ico (12.3 KB)
✓ 48×48: MyApp_48x48.ico (8.7 KB)
✓ 32×32: MyApp_32x32.ico (5.4 KB)
✓ 16×16: MyApp_16x16.ico (3.1 KB)

Generated 6 icons in ./output/icons/windows/
```

### Example 2: Progressive Web App

```bash
python convert_to_ico.py --input webapp-icon.png --preset pwa
```

Output:
```
✓ 512×512: webapp-icon_512x512.ico (120.5 KB)
✓ 192×192: webapp-icon_192x192.ico (35.2 KB)

Generated 2 icons in ./output/icons/pwa/
```

### Example 3: Complete Favicon Set

```bash
python convert_to_ico.py --input favicon.png --preset favicon-complete
```

Output:
```
✓ 512×512: favicon_512x512.ico (200.1 KB)
✓ 192×192: favicon_192x192.ico (80.3 KB)
✓ 180×180: favicon_180x180.ico (50.2 KB)
✓ 48×48: favicon_48x48.ico (20.1 KB)
✓ 32×32: favicon_32x32.ico (15.0 KB)
✓ 16×16: favicon_16x16.ico (5.2 KB)

Generated 6 icons in ./output/icons/favicon-complete/
```

### Example 4: Custom Sizes

```bash
python convert_to_ico.py --input custom.png --sizes 64 128 256 512
```

Output:
```
✓ 512×512: custom_512x512.ico (180.5 KB)
✓ 256×256: custom_256x256.ico (85.2 KB)
✓ 128×128: custom_128x128.ico (42.3 KB)
✓ 64×64: custom_64x64.ico (18.7 KB)

Generated 4 custom icons in ./output/icons/custom/
```

## Troubleshooting

### Problem: "Pillow not installed"
**Solution**: The script auto-installs Pillow. If it fails, manually run:
```bash
pip install Pillow>=10.0.0
```

### Problem: "Input image too small"
**Solution**: Use a higher resolution PNG source image (minimum 1024×1024 recommended)

### Problem: "Permission denied on output directory"
**Solution**: Specify a different output directory with `--output` flag or check folder permissions

### Problem: "ICO files are too large"
**Solution**:
- Start with a smaller source image
- Use fewer sizes
- Optimize the source PNG before conversion

### Problem: "Icons look blurry at small sizes"
**Solution**:
- Use simpler, bolder designs
- Avoid fine details that don't scale well
- Test and iterate at 16×16 and 32×32 sizes

## Advanced Usage

### Creating Platform-Specific Icon Sets

```bash
# Windows app bundle
python convert_to_ico.py --input app.png --preset windows -o ./dist/icons

# macOS app bundle
python convert_to_ico.py --input app.png --preset macos -o ./dist/icons

# Cross-platform complete set
python convert_to_ico.py --input app.png --preset all -o ./dist/icons
```

### Integration with Build Scripts

```bash
#!/bin/bash
# build-icons.sh

SOURCE_IMAGE="assets/app-icon.png"
OUTPUT_DIR="dist/icons"

# Generate Windows icons
python .claude/skills/png-to-ico/scripts/convert_to_ico.py \
  --input "$SOURCE_IMAGE" \
  --preset windows \
  --output "$OUTPUT_DIR"

# Generate web icons
python .claude/skills/png-to-ico/scripts/convert_to_ico.py \
  --input "$SOURCE_IMAGE" \
  --preset favicon-complete \
  --output "$OUTPUT_DIR"

echo "Icon generation complete!"
```

## Customizing Presets

To add or modify presets, edit `presets.json`:

```json
{
  "my-custom-preset": {
    "sizes": [512, 256, 128, 64],
    "description": "My custom icon sizes",
    "target_sizes_kb": [200, 100, 50, 20],
    "use_cases": [
      "Custom use case 1",
      "Custom use case 2"
    ]
  }
}
```

## Contributing

To improve this skill:

1. Add new presets to `presets.json`
2. Update `SKILL.md` with new documentation
3. Test conversions with sample images
4. Update this README with examples

## License

MIT License - See LICENSE.txt for details

## Support

For issues or questions:
1. Check this README and the size reference table
2. Review the SKILL.md for detailed usage instructions
3. Examine the generated `manifest.json` for conversion details
4. Test with a simple, high-resolution PNG to isolate issues

## Version History

- **v1.0.0** (2025-12-03): Initial release
  - 15 predefined presets
  - Support for Windows, macOS, web, mobile platforms
  - Batch conversion with quality optimization
  - Automatic metadata generation
