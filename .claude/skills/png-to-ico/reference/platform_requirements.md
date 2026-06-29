# Platform-Specific Icon Requirements

This document details the specific technical requirements, restrictions, and best practices for icons on each major platform.

## Table of Contents
- [Windows](#windows)
- [macOS](#macos)
- [Web Browsers](#web-browsers)
- [Chrome Extensions](#chrome-extensions)
- [iOS](#ios)
- [Android](#android)
- [Progressive Web Apps](#progressive-web-apps)

---

## Windows

### File Format Requirements
- **Format**: .ico (Windows Icon)
- **Color Depth**: 32-bit with alpha channel (preferred)
- **Compression**: Uncompressed or PNG compression inside ICO
- **Multi-resolution**: Single .ico file should contain multiple sizes

### Required Sizes
```
Critical: 256×256, 128×128, 64×64, 48×48, 32×32, 16×16
Optional: 20×20, 24×24, 40×40, 96×96
```

### Technical Specifications
- **Color Profile**: sRGB
- **Transparency**: Supported via alpha channel
- **Maximum File Size**: No hard limit, but keep <500 KB total
- **DPI**: 96 DPI (standard Windows)

### Implementation Details

#### Creating Multi-Size ICO
```python
# Using Pillow
from PIL import Image

img = Image.open('source.png')
img.save('output.ico', format='ICO', sizes=[
    (16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)
])
```

#### Manifest Integration (for applications)
```xml
<assembly>
  <application>
    <windowsSettings>
      <dpiAware>true</dpiAware>
    </windowsSettings>
  </application>
</assembly>
```

### Design Guidelines
- **Style**: Realistic or flat design both work
- **Shadows**: Can include soft drop shadows
- **Perspective**: Slight 3D perspective acceptable
- **Colors**: Support both light and dark Windows themes
- **16×16 Minimum**: Must be readable and recognizable

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Icon looks blurry | Ensure pixel-perfect design at each size |
| Wrong size displayed | Include all standard sizes in .ico |
| Transparency not working | Save with 32-bit color depth + alpha |
| Large file size | Use PNG compression inside ICO |

### Testing Checklist
- [ ] Display in Windows Explorer (all view modes)
- [ ] Test on Windows 10 and 11
- [ ] Verify in system tray (if applicable)
- [ ] Check taskbar appearance
- [ ] Test on high-DPI displays (150%, 200%)

---

## macOS

### File Format Requirements
- **Format**: .icns (Apple Icon Image)
- **Color Depth**: 32-bit RGBA
- **Compression**: PNG compression
- **Multi-resolution**: Single .icns contains all sizes

### Required Sizes (iconset)
```
Critical:
- icon_512x512@2x.png (1024×1024) - App Store requirement
- icon_512x512.png (512×512)
- icon_256x256@2x.png (512×512)
- icon_256x256.png (256×256)
- icon_128x128@2x.png (256×256)
- icon_128x128.png (128×128)

Recommended:
- icon_32x32@2x.png (64×64)
- icon_32x32.png (32×32)
- icon_16x16@2x.png (32×32)
- icon_16x16.png (16×16)
```

### Technical Specifications
- **Color Profile**: Display P3 (preferred) or sRGB
- **Transparency**: Required (no opaque background)
- **Maximum File Size**: <1 MB total
- **DPI**: Retina-ready (@2x versions)

### Implementation Details

#### Creating .icns from iconset
```bash
# 1. Create iconset directory
mkdir MyIcon.iconset

# 2. Add all required PNG files
# ... (see structure above)

# 3. Convert to .icns
iconutil -c icns MyIcon.iconset
```

#### Info.plist Integration
```xml
<key>CFBundleIconFile</key>
<string>AppIcon</string>
<key>CFBundleIconName</key>
<string>AppIcon</string>
```

### Design Guidelines
- **Style**: Flat design with subtle gradients (no 3D effects)
- **Shadows**: None (macOS applies automatically)
- **Corners**: Don't pre-round (macOS applies mask)
- **Transparency**: Must have transparent background
- **Grid System**: Use macOS icon grid (circles, squares)
- **Safe Area**: Keep important elements in center 80%

### macOS Icon Grid System
```
Canvas: 1024×1024
Bounding Box: 820×820 (centered)
Circle: 824×824 diameter
Square: 768×768
Horizontal Rectangle: 824×618
Vertical Rectangle: 618×824
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Icon has white halo | Ensure proper transparency, no white background |
| Looks different in dark mode | Test both modes, adjust contrast |
| Blurry on Retina | Provide all @2x versions |
| App Store rejection | Must include 1024×1024 @2x version |

### Testing Checklist
- [ ] Display in Finder (all view modes)
- [ ] Test in Dock (normal and magnified)
- [ ] Verify in Launchpad
- [ ] Check light and dark mode appearance
- [ ] Test on Retina and non-Retina displays
- [ ] Validate with App Store tools

---

## Web Browsers

### File Format Requirements
- **Format**: .ico (legacy), .png (modern), .svg (progressive)
- **Color Depth**: 24-bit RGB or 32-bit RGBA
- **Compression**: Optimized PNG compression
- **Multi-size**: Separate files per size

### Required Sizes
```
Critical:
- 16×16 (favicon.ico)
- 32×32 (favicon-32×32.png)

Recommended:
- 48×48 (favicon-48×48.png)
- 180×180 (apple-touch-icon.png)
- 192×192 (android-chrome-192×192.png)
```

### Technical Specifications
- **Color Profile**: sRGB
- **Transparency**: Supported in PNG, not in ICO fallback
- **Maximum File Size**: <50 KB per icon
- **Optimization**: Use tools like ImageOptim, TinyPNG

### Implementation Details

#### HTML Head Tags
```html
<!-- Legacy ICO -->
<link rel="icon" href="/favicon.ico" sizes="any">

<!-- Modern PNG -->
<link rel="icon" type="image/png" sizes="32×32" href="/favicon-32×32.png">
<link rel="icon" type="image/png" sizes="16×16" href="/favicon-16×16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180×180" href="/apple-touch-icon.png">

<!-- Android Chrome -->
<link rel="icon" type="image/png" sizes="192×192" href="/android-chrome-192×192.png">

<!-- SVG (progressive) -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
```

#### Serving Optimization
- Place favicon.ico in root directory (fallback)
- Use appropriate cache headers
- Serve from CDN for performance
- Provide compressed versions (gzip/brotli)

### Design Guidelines
- **Style**: Simple, high-contrast, recognizable at 16×16
- **Colors**: 2-3 colors maximum for clarity
- **Details**: Avoid fine details (invisible at small sizes)
- **Letter Icons**: Use bold, sans-serif fonts
- **Testing**: View actual size in browser tab

### Browser-Specific Notes

#### Chrome/Edge
- Supports PNG, ICO, SVG
- Displays 16×16 in tabs (may upscale to 32×32 on high-DPI)
- Caches aggressively (use cache-busting if updating)

#### Firefox
- Supports PNG, ICO, SVG
- Prefers .ico for legacy compatibility
- Uses 16×16 for tabs, 32×32 for bookmarks

#### Safari
- Prefers Apple Touch Icon for iOS devices
- Uses 180×180 for home screen (iOS)
- Supports SVG favicons (recent versions)

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Favicon not updating | Clear browser cache, use version query string |
| Looks blurry | Provide exact-size PNGs, not scaled versions |
| Wrong icon displays | Check file paths and MIME types |
| 404 errors | Ensure favicon.ico in root directory |

### Testing Checklist
- [ ] Display in Chrome tabs
- [ ] Test in Firefox tabs
- [ ] Verify in Safari (desktop and iOS)
- [ ] Check Edge browser
- [ ] Test bookmarks display
- [ ] Verify on high-DPI displays

---

## Chrome Extensions

### File Format Requirements
- **Format**: .png (required)
- **Color Depth**: 32-bit RGBA
- **Compression**: Optimized PNG
- **Transparency**: Supported and recommended

### Required Sizes
```
Critical (all required):
- 16×16 (browser action, context menus)
- 32×32 (Windows devices, toolbar @2x)
- 48×48 (extension management page)
- 128×128 (Chrome Web Store, installation)
```

### Technical Specifications
- **Color Profile**: sRGB
- **Transparency**: Alpha channel supported
- **Maximum File Size**: No hard limit (<100 KB recommended)
- **DPI**: Provide standard and @2x versions

### Implementation Details

#### manifest.json (Manifest V3)
```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0",
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png"
    }
  }
}
```

#### Optional Sizes
```json
{
  "icons": {
    "24": "icons/icon24.png",  // Optional but recommended
    "64": "icons/icon64.png"   // Optional
  }
}
```

### Design Guidelines
- **Style**: Simple, symbolic, recognizable
- **Background**: Transparent preferred
- **Colors**: Work well on both light and dark themes
- **Contrast**: High contrast for visibility
- **Consistency**: Maintain same design across all sizes

### Chrome Web Store Requirements
- **128×128**: Primary icon (displayed prominently)
- **Minimum**: Must provide 16, 48, 128
- **Promotional Images**: 440×280, 920×680, 1400×560
- **Screenshots**: 1280×800 or 640×400

### Dynamic Icons (Programmatic)
```javascript
// Change icon dynamically
chrome.action.setIcon({
  path: {
    "16": "icons/active16.png",
    "32": "icons/active32.png"
  }
});

// Set badge
chrome.action.setBadgeText({ text: "5" });
chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Icon too complex at 16×16 | Simplify design, use bold shapes |
| Invisible on dark theme | Add subtle border or use high contrast |
| Pixelated on Retina | Provide @2x versions (32 for 16, etc.) |
| Store rejection | Ensure all 4 sizes provided and valid |

### Testing Checklist
- [ ] Install extension and check toolbar icon
- [ ] Test on light Chrome theme
- [ ] Test on dark Chrome theme
- [ ] Verify in chrome://extensions page
- [ ] Check context menu icon (if applicable)
- [ ] Test on Windows, macOS, Linux
- [ ] Validate high-DPI displays

---

## iOS

### File Format Requirements
- **Format**: .png (required)
- **Color Depth**: 24-bit RGB (no alpha channel!)
- **Compression**: PNG compression
- **Transparency**: **NOT allowed** (must be opaque)

### Required Sizes (Assets.xcassets)

#### iPhone
```
- 180×180 (@3x) - iPhone home screen (iOS 14+)
- 120×120 (@2x) - iPhone home screen
- 80×80 (@2x) - Spotlight search
- 60×60 (@2x, @3x) - Settings
```

#### iPad
```
- 167×167 (@2x) - iPad Pro home screen
- 152×152 (@2x) - iPad home screen
- 76×76 (@1x, @2x) - iPad home (legacy)
```

#### App Store
```
- 1024×1024 - App Store (MANDATORY)
```

### Technical Specifications
- **Color Profile**: sRGB or Display P3
- **Transparency**: **Forbidden** (will be rejected)
- **Alpha Channel**: Must not be present
- **Maximum File Size**: <1 MB per icon
- **Corner Radius**: Applied automatically (don't pre-round)

### Implementation Details

#### Contents.json Structure
```json
{
  "images": [
    {
      "size": "60x60",
      "idiom": "iphone",
      "filename": "Icon-60@2x.png",
      "scale": "2x"
    },
    {
      "size": "60x60",
      "idiom": "iphone",
      "filename": "Icon-60@3x.png",
      "scale": "3x"
    }
  ],
  "info": {
    "version": 1,
    "author": "xcode"
  }
}
```

#### Xcode Asset Catalog
1. Create `AppIcon.appiconset` in `Assets.xcassets`
2. Add all required PNG files
3. Update `Contents.json` with proper mappings
4. Validate with Xcode analyzer

### Design Guidelines
- **Background**: Must be opaque (no transparency!)
- **Corners**: Square (iOS applies rounding automatically)
- **Shadows**: None (iOS applies automatically)
- **Style**: Flat design preferred (iOS 7+ style)
- **Grid**: Use iOS icon template grid
- **Safe Area**: Keep content in center ~90%

### iOS Icon Masking
- iOS applies automatic corner radius: `r = w × 0.2237` (for width w)
- Example: 180×180 icon → radius ~40.3px
- Don't pre-apply rounding or iOS will double-mask

### App Store Connect Requirements
- **1024×1024**: Mandatory for submission
- **Format**: PNG (no alpha)
- **Color Space**: RGB (not CMYK)
- **Naming**: No specific requirement, but descriptive
- **Layers**: Flattened (no layers)

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Rejection: Alpha channel | Remove alpha, use opaque background |
| Rejection: Wrong size | Provide exact pixel dimensions |
| Icon looks different | Test on actual device, not just simulator |
| Rounded corners doubled | Don't pre-round, iOS applies masking |
| Colors look different | Use Display P3 for wide color gamut |

### Testing Checklist
- [ ] All required sizes in Assets.xcassets
- [ ] No alpha channel on any icon
- [ ] 1024×1024 for App Store Connect
- [ ] Test on iPhone (all models)
- [ ] Test on iPad (all models)
- [ ] Verify in Settings app
- [ ] Check Spotlight search appearance
- [ ] Validate with Xcode analyzer
- [ ] Submit to TestFlight for review

---

## Android

### File Format Requirements
- **Format**: .png (preferred), .xml (vector drawable)
- **Color Depth**: 32-bit RGBA
- **Compression**: Optimized PNG
- **Transparency**: Supported (adaptive icons use transparency)

### Required Sizes (Legacy)

#### Density-Specific Sizes
```
res/mipmap-mdpi/      ic_launcher.png (48×48)     [1x]
res/mipmap-hdpi/      ic_launcher.png (72×72)     [1.5x]
res/mipmap-xhdpi/     ic_launcher.png (96×96)     [2x]
res/mipmap-xxhdpi/    ic_launcher.png (144×144)   [3x]
res/mipmap-xxxhdpi/   ic_launcher.png (192×192)   [4x]
```

### Adaptive Icons (Android 8.0+)

#### Required Layers
```
Foreground: 108×108 dp (contains main icon)
Background: 108×108 dp (solid color or pattern)
Safe Zone: Center 72×72 dp (critical content area)
```

#### Directory Structure
```
res/
  mipmap-anydpi-v26/
    ic_launcher.xml              (Adaptive icon definition)
  mipmap-mdpi/
    ic_launcher_foreground.png   (108×108)
    ic_launcher_background.png   (108×108)
  mipmap-hdpi/
    ic_launcher_foreground.png   (162×162)
    ic_launcher_background.png   (162×162)
  ... (similar for xhdpi, xxhdpi, xxxhdpi)
```

### Technical Specifications
- **Color Profile**: sRGB
- **Transparency**: Foreground layer only
- **Maximum File Size**: <100 KB per icon
- **Grid System**: Material Design icon grid

### Implementation Details

#### ic_launcher.xml (Adaptive Icon)
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
```

#### Vector Drawable (Recommended)
```xml
<!-- ic_launcher_foreground.xml -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#3DDC84"
        android:pathData="M54,54m-54,0a54,54 0,1 1,108 0a54,54 0,1 1,-108 0"/>
</vector>
```

#### AndroidManifest.xml
```xml
<application
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    ...>
</application>
```

### Design Guidelines

#### Legacy Icons
- **Style**: Material Design (flat, bold colors)
- **Shadows**: Long shadow (45° angle)
- **Edges**: Slight edge lighting
- **Grid**: Material icon grid system

#### Adaptive Icons
- **Foreground**: Main icon graphic (safe zone: 72×72dp)
- **Background**: Simple color or pattern
- **Masking**: System applies shape mask
- **Shapes**: Circle, squircle, rounded square, square
- **Animation**: Can animate between foreground/background

### Adaptive Icon Safe Zones
```
Canvas: 108×108 dp
Safe Zone: 72×72 dp (center)
Padding: 18dp on all sides
Critical Content: Stay within 66×66 dp for guaranteed visibility
```

### Launcher Shapes (Adaptive)
Different launchers apply different masks:
- Circle (Pixel, OnePlus)
- Squircle (Samsung)
- Rounded Square (Xiaomi)
- Square (Sony)

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Icon cropped | Keep important content in 72×72 dp safe zone |
| Different shapes on devices | Test with adaptive icon previewer |
| Large APK size | Use vector drawables instead of PNGs |
| Blurry on xxxhdpi | Provide xxxhdpi density (192×192) |

### Testing Checklist
- [ ] Provide all 5 density versions (mdpi to xxxhdpi)
- [ ] Test adaptive icon on various launchers
- [ ] Check foreground safe zone (72×72dp)
- [ ] Verify background layer works standalone
- [ ] Test all launcher shapes (circle, squircle, etc.)
- [ ] Validate with Android Studio icon previewer
- [ ] Test on physical devices (Samsung, Pixel, etc.)
- [ ] Check Play Store display (512×512 asset)

---

## Progressive Web Apps

### File Format Requirements
- **Format**: .png (required)
- **Color Depth**: 32-bit RGBA
- **Compression**: Optimized PNG
- **Transparency**: Supported

### Required Sizes
```
Critical:
- 512×512 (high-resolution, maskable)
- 192×192 (Android home screen, maskable)

Recommended:
- 144×144 (iOS home screen)
- 96×96 (Android legacy devices)
- 72×72 (Android low-DPI)
- 48×48 (Android minimum)
```

### Technical Specifications
- **Color Profile**: sRGB
- **Transparency**: Supported (use for maskable)
- **Maximum File Size**: <200 KB per icon
- **Purpose**: "any", "maskable", or "monochrome"

### Implementation Details

#### manifest.json
```json
{
  "name": "My PWA",
  "short_name": "PWA",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192×192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512×512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-monochrome.png",
      "sizes": "192×192",
      "type": "image/png",
      "purpose": "monochrome"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000"
}
```

### Design Guidelines

#### Maskable Icons
- **Canvas**: Full icon size (e.g., 512×512)
- **Safe Zone**: Center 80% (e.g., 410×410 for 512×512)
- **Padding**: 10% on all sides minimum
- **Critical Content**: Keep in inner 60-70%
- **Background**: Opaque, solid color recommended

#### Purpose Types

**"any"**: Standard icon
- No special masking
- Can have transparent areas
- Used as-is

**"maskable"**: Adaptive icon
- System applies mask
- Must fill entire canvas
- Safe zone critical
- Works on Android/iOS

**"monochrome"**: Single-color icon
- For theming and tinting
- System applies color
- Used in UI components

### Maskable Icon Safe Zones
```
Icon Size: 512×512
Safe Zone: 410×410 (80% of size)
Minimum Padding: 51px on all sides (10%)
Guaranteed Visible: ~307×307 (60%)
```

### Testing Tools
- [Maskable.app](https://maskable.app) - Test maskable icons
- Chrome DevTools - Application > Manifest
- Lighthouse PWA audit
- Various Android launchers

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Icon cropped on Android | Use maskable icon with safe zone |
| No install prompt | Ensure 192 and 512 icons present |
| Wrong icon displayed | Check "purpose" property |
| Lighthouse warning | Provide both "any" and "maskable" |

### Testing Checklist
- [ ] 512×512 and 192×192 icons present
- [ ] Test maskable icon at maskable.app
- [ ] Verify manifest.json validates
- [ ] Test installation on Android
- [ ] Test installation on iOS (if supported)
- [ ] Check with Lighthouse PWA audit
- [ ] Verify icons on various launchers
- [ ] Test standalone display mode

---

## Cross-Platform Icon Checklist

### Design Phase
- [ ] Create source at highest resolution (1024×1024+)
- [ ] Use simple, recognizable design
- [ ] Test at 16×16 for clarity
- [ ] Design with transparency in mind
- [ ] Consider light and dark backgrounds

### Export Phase
- [ ] Windows: .ico with 6 sizes
- [ ] macOS: .icns with @1x and @2x
- [ ] Web: .ico + .png (16, 32, 48)
- [ ] iOS: All required sizes (no alpha!)
- [ ] Android: 5 densities + adaptive
- [ ] PWA: 512 and 192 (maskable)

### Testing Phase
- [ ] Test on all target platforms
- [ ] Verify file sizes within limits
- [ ] Check high-DPI displays
- [ ] Test light and dark themes
- [ ] Validate with platform tools

---

*Last Updated: 2025-12-03*
