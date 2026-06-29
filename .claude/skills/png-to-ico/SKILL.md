---
name: png-to-ico
description: Convert PNG images to ICO format with various preset sizes for Windows, macOS, web, mobile, and browser extensions
version: 1.0.0
author: Claude Code
category: image-processing
---

# PNG to ICO Converter Skill

A comprehensive skill for converting PNG images to ICO format with predefined size presets for different platforms and use cases.

## Overview

This skill automates the process of converting PNG images to ICO (icon) format with appropriate sizes for:
- Windows applications (.ico)
- macOS applications (.icns)
- Web favicons
- Browser extensions (Chrome, Firefox, etc.)
- Mobile apps (iOS, Android)
- UI icons and illustrations

## Features

- **Batch conversion** with multiple size outputs
- **Preset templates** for common use cases
- **Custom size specifications**
- **Quality optimization** for file size targets
- **Automatic output organization**

## Usage

When the user invokes this skill, follow these steps:

### Phase 1: Understand Requirements

1. **Identify input PNG file(s)**
   - Ask user to provide the PNG file path(s)
   - Verify file exists and is readable
   - Check image dimensions and quality

2. **Determine conversion preset**
   - Ask user which preset to use (or allow custom sizes)
   - Available presets:
     - `windows` - Windows app icons (256×256, 128×128, 64×64, 48×48, 32×32, 16×16)
     - `macos` - macOS app icons (1024×1024, 512×512, 256×256, 128×128, 64×64, 32×32)
     - `web` - Web favicons (16×16, 32×32, 48×48)
     - `pwa` - Progressive Web App (192×192, 512×512)
     - `chrome-ext` - Chrome extension (16×16, 32×32, 48×48, 128×128)
     - `ios` - iOS app icons (1024×1024, 180×180, 120×120, 152×152, 167×167, 80×80)
     - `android` - Android app icons (192×192, 144×144, 96×96, 72×72, 48×48)
     - `ui` - UI toolbar icons (24×24, 32×32, 48×48)
     - `all` - Generate all common sizes
     - `custom` - User-specified sizes

3. **Set output directory**
   - Default: `./output/icons/`
   - Ask if user wants different output location
   - Create directory if it doesn't exist

### Phase 2: Conversion Process

1. **Execute conversion script**
   ```bash
   python .claude/skills/png-to-ico/scripts/convert_to_ico.py \
     --input <input_png> \
     --preset <preset_name> \
     --output <output_dir>
   ```

2. **Monitor conversion progress**
   - Report each size being generated
   - Verify output file sizes meet targets
   - Handle any errors gracefully

3. **Organize output files**
   - Create subdirectories by platform if needed
   - Generate manifest file listing all outputs
   - Include metadata (size, file size, creation date)

### Phase 3: Validation & Report

1. **Verify all ICO files generated**
   - Check each output file exists
   - Validate file sizes are reasonable
   - Ensure no corruption

2. **Generate conversion report**
   - List all generated files with:
     - Filename
     - Dimensions
     - File size
     - Use case / purpose
   - Show total files created
   - Display output directory path

3. **Provide usage guidance**
   - Explain where to use each icon size
   - Platform-specific instructions if needed
   - Next steps (e.g., adding to app manifest)

## Script Details

### convert_to_ico.py

The main conversion script uses Python's `Pillow` (PIL) library to:
- Load PNG images
- Resize to target dimensions with high-quality filtering
- Optimize for file size while maintaining quality
- Save as ICO format with multiple icon sizes embedded
- Generate metadata and reports

### presets.json

Contains predefined size configurations for common use cases:

```json
{
  "windows": {
    "sizes": [256, 128, 64, 48, 32, 16],
    "description": "Windows application icons (.ico)",
    "target_sizes_kb": [50, 30, 10, 8, 5, 2]
  },
  "macos": {
    "sizes": [1024, 512, 256, 128, 64, 32],
    "description": "macOS application icons (.icns)",
    "target_sizes_kb": [300, 200, 100, 60, 40, 20]
  },
  ...
}
```

## Dependencies

Required Python packages (auto-installed if missing):
- `Pillow >= 10.0.0` - Image processing
- `pathlib` - Path handling (stdlib)
- `json` - Configuration parsing (stdlib)
- `argparse` - CLI argument parsing (stdlib)

## Error Handling

The skill handles common issues:
- **Missing dependencies**: Auto-install with pip
- **Invalid PNG file**: Clear error message with guidance
- **Insufficient permissions**: Suggest output directory change
- **Low input resolution**: Warn if upscaling is needed
- **Disk space issues**: Check before conversion

## Best Practices

1. **Input Quality**: Use high-resolution PNG (at least 1024×1024) for best results
2. **Transparency**: Ensure PNG has alpha channel for proper transparency in ICO
3. **Simple designs**: Icons work best with clear, simple graphics
4. **Test output**: Verify icons look good at smallest sizes (16×16, 32×32)
5. **File size**: Balance quality vs. file size based on use case

## Examples

### Example 1: Windows App Icon
```
User: Convert logo.png to Windows app icons
Assistant: I'll convert logo.png using the Windows preset...
[Executes conversion]
Generated 6 icons: 256×256 (45KB), 128×128 (28KB), 64×64 (12KB),
48×48 (8KB), 32×32 (5KB), 16×16 (3KB)
Output: ./output/icons/windows/
```

### Example 2: PWA Icons
```
User: I need PWA icons from my app-icon.png
Assistant: Converting to PWA preset (192×192 and 512×512)...
[Executes conversion]
Generated 2 icons:
- icon-192×192.png (35KB) - Android home screen
- icon-512×512.png (120KB) - High resolution
Output: ./output/icons/pwa/
```

### Example 3: Custom Sizes
```
User: Convert banner.png to 64×64, 128×128, and 256×256
Assistant: Using custom preset with sizes: [64, 128, 256]...
[Executes conversion]
Generated 3 custom icons in ./output/icons/custom/
```

## Troubleshooting

### Issue: "Pillow not installed"
**Solution**: Run `pip install Pillow`

### Issue: "Input image too small"
**Solution**: Use higher resolution PNG or accept quality warning for upscaling

### Issue: "Permission denied on output"
**Solution**: Change output directory or check folder permissions

### Issue: "ICO file too large"
**Solution**: Use fewer sizes or reduce quality settings

## Reference Files

- `reference/icon_sizes_guide.md` - Complete size reference table
- `reference/platform_requirements.md` - Platform-specific requirements
- `scripts/requirements.txt` - Python dependencies
- `scripts/convert_to_ico.py` - Main conversion script
- `presets.json` - Size preset configurations

## Updates & Maintenance

To add new presets:
1. Edit `presets.json` with new size configuration
2. Update this SKILL.md with new preset documentation
3. Test conversion with sample images

## License

MIT License - See LICENSE.txt for details
