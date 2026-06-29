# Complete Icon Sizes Reference Guide

This guide provides a comprehensive reference for icon sizes across all major platforms and use cases.

## Table of Contents
- [Windows Applications](#windows-applications)
- [macOS Applications](#macos-applications)
- [Web Favicons](#web-favicons)
- [Progressive Web Apps (PWA)](#progressive-web-apps-pwa)
- [Chrome Extensions](#chrome-extensions)
- [iOS Applications](#ios-applications)
- [Android Applications](#android-applications)
- [UI Icons](#ui-icons)
- [Illustrations & Splash Screens](#illustrations--splash-screens)

---

## Windows Applications

### Standard .ico Sizes

| Size (px) | Use Case | File Format | Target Size | Priority |
|-----------|----------|-------------|-------------|----------|
| 256×256 | High-resolution main icon | .ico | 50–200 KB | ⭐⭐⭐ Critical |
| 128×128 | High-resolution backup | .ico | 30–80 KB | ⭐⭐⭐ Critical |
| 64×64 | Explorer general icon display | .ico | 10–40 KB | ⭐⭐⭐ Critical |
| 48×48 | Quick access / Explorer | .ico | 8–30 KB | ⭐⭐⭐ Critical |
| 32×32 | System small icon | .ico | 5–20 KB | ⭐⭐⭐ Critical |
| 16×16 | Minimum icon size | .ico | 2–10 KB | ⭐⭐⭐ Critical |

### Implementation Notes
- Windows .ico files should contain multiple sizes embedded in a single file
- All 6 standard sizes are recommended for maximum compatibility
- 256×256 is the primary display size in Windows 10/11
- 16×16 must be crisp and recognizable (test carefully!)
- Transparency is supported via alpha channel

### File Naming Convention
```
AppName.ico (contains all sizes)
or
AppName_256.ico
AppName_128.ico
AppName_64.ico
AppName_48.ico
AppName_32.ico
AppName_16.ico
```

---

## macOS Applications

### .icns Sizes

| Size (px) | Scale Factor | Use Case | File Format | Target Size | Priority |
|-----------|--------------|----------|-------------|-------------|----------|
| 1024×1024 | @2x | App Store / Launchpad | .icns | 100–300 KB | ⭐⭐⭐ Critical |
| 512×512 | @2x / @1x | Finder high-res | .icns | 80–200 KB | ⭐⭐⭐ Critical |
| 256×256 | @2x / @1x | Finder standard | .icns | 40–100 KB | ⭐⭐⭐ Critical |
| 128×128 | @2x / @1x | Finder medium | .icns | 20–60 KB | ⭐⭐ Important |
| 64×64 | @2x / @1x | Toolbar | .icns | 10–40 KB | ⭐⭐ Important |
| 32×32 | @2x / @1x | Small icon | .icns | 5–20 KB | ⭐ Optional |
| 16×16 | @2x / @1x | Minimum | .icns | 2–10 KB | ⭐ Optional |

### Implementation Notes
- .icns format bundles all sizes together
- 1024×1024 is **mandatory** for App Store submission
- macOS applies automatic visual effects (don't add your own shadows/gloss)
- Test in both light and dark mode
- Use simple, bold designs

### Required iconset Structure
```
AppIcon.iconset/
  icon_16x16.png
  icon_16x16@2x.png (32×32)
  icon_32x32.png
  icon_32x32@2x.png (64×64)
  icon_128x128.png
  icon_128x128@2x.png (256×256)
  icon_256x256.png
  icon_256x256@2x.png (512×512)
  icon_512x512.png
  icon_512x512@2x.png (1024×1024)
```

---

## Web Favicons

### Standard Favicon Sizes

| Size (px) | Use Case | File Format | Target Size | Priority |
|-----------|----------|-------------|-------------|----------|
| 16×16 | Basic favicon (browser tabs) | .ico, .png | <5 KB | ⭐⭐⭐ Critical |
| 32×32 | Standard favicon (high-DPI) | .ico, .png | 5–15 KB | ⭐⭐⭐ Critical |
| 48×48 | High-resolution favicon | .ico, .png | 10–20 KB | ⭐⭐ Important |
| 180×180 | Apple Touch Icon (iOS) | .png | 20–50 KB | ⭐⭐ Important |
| 192×192 | Android Chrome | .png | 30–80 KB | ⭐⭐ Important |
| 512×512 | PWA high-resolution | .png | 100–200 KB | ⭐ Optional |

### HTML Implementation
```html
<!-- Standard favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32×32" href="/favicon-32×32.png">
<link rel="icon" type="image/png" sizes="16×16" href="/favicon-16×16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180×180" href="/apple-touch-icon.png">

<!-- Android Chrome -->
<link rel="icon" type="image/png" sizes="192×192" href="/android-chrome-192×192.png">
```

### Implementation Notes
- Use .ico format for IE compatibility
- Provide .png alternatives for modern browsers
- 16×16 is the most critical size (must be recognizable)
- Use simple, high-contrast designs
- Test at actual size in browser tabs

---

## Progressive Web Apps (PWA)

### Manifest Icon Sizes

| Size (px) | Purpose | File Format | Target Size | Priority |
|-----------|---------|-------------|-------------|----------|
| 512×512 | High-resolution icon | .png | 100–200 KB | ⭐⭐⭐ Critical |
| 192×192 | Android home screen | .png | 30–80 KB | ⭐⭐⭐ Critical |
| 144×144 | Medium density | .png | 20–60 KB | ⭐⭐ Important |
| 96×96 | Low density | .png | 10–40 KB | ⭐ Optional |
| 72×72 | Extra low density | .png | 10–30 KB | ⭐ Optional |
| 48×48 | Minimum | .png | 5–20 KB | ⭐ Optional |

### manifest.json Implementation
```json
{
  "name": "My PWA",
  "icons": [
    {
      "src": "/icons/icon-192×192.png",
      "sizes": "192×192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512×512.png",
      "sizes": "512×512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Implementation Notes
- 192×192 and 512×512 are **mandatory** for PWA
- Use `"purpose": "any maskable"` for adaptive icons
- Provide safe zone (inner 80%) for maskable icons
- Test on actual Android devices
- Ensure icons work on various launcher backgrounds

---

## Chrome Extensions

### Extension Icon Sizes

| Size (px) | Use Case | File Format | Target Size | Priority |
|-----------|----------|-------------|-------------|----------|
| 16×16 | Browser action small | .png | <5 KB | ⭐⭐⭐ Critical |
| 32×32 | Toolbar | .png | 5–15 KB | ⭐⭐⭐ Critical |
| 48×48 | Extension management | .png | 10–20 KB | ⭐⭐⭐ Critical |
| 128×128 | Chrome Web Store | .png | 20–60 KB | ⭐⭐⭐ Critical |

### manifest.json Implementation
```json
{
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

### Implementation Notes
- All 4 sizes are required for Chrome Web Store
- 128×128 is displayed prominently in the store
- Use simple, recognizable symbols
- Test against light and dark Chrome themes
- Maintain consistency across sizes

---

## iOS Applications

### App Icon Sizes

| Size (px) | Device | Scale | Use Case | Priority |
|-----------|--------|-------|----------|----------|
| 1024×1024 | All | - | App Store | ⭐⭐⭐ Critical |
| 180×180 | iPhone | @3x | Home screen (iOS 14+) | ⭐⭐⭐ Critical |
| 120×120 | iPhone | @2x | Home screen | ⭐⭐⭐ Critical |
| 167×167 | iPad Pro | @2x | Home screen | ⭐⭐ Important |
| 152×152 | iPad | @2x | Home screen | ⭐⭐ Important |
| 80×80 | iPhone/iPad | @2x | Spotlight | ⭐⭐ Important |
| 76×76 | iPad | @1x | Home screen (legacy) | ⭐ Optional |
| 60×60 | iPhone | @1x | Home screen (legacy) | ⭐ Optional |
| 40×40 | iPhone/iPad | @1x | Spotlight (legacy) | ⭐ Optional |

### Assets.xcassets Structure
```
AppIcon.appiconset/
  Contents.json
  Icon-App-20x20@1x.png (20×20)
  Icon-App-20x20@2x.png (40×40)
  Icon-App-20x20@3x.png (60×60)
  Icon-App-29x29@1x.png (29×29)
  Icon-App-29x29@2x.png (58×58)
  Icon-App-29x29@3x.png (87×87)
  Icon-App-40x40@1x.png (40×40)
  Icon-App-40x40@2x.png (80×80)
  Icon-App-40x40@3x.png (120×120)
  Icon-App-60x60@2x.png (120×120)
  Icon-App-60x60@3x.png (180×180)
  Icon-App-76x76@1x.png (76×76)
  Icon-App-76x76@2x.png (152×152)
  Icon-App-83.5x83.5@2x.png (167×167)
  Icon-App-1024x1024@1x.png (1024×1024)
```

### Implementation Notes
- 1024×1024 is **mandatory** for App Store submission
- iOS applies automatic corner rounding (don't pre-round)
- No transparency allowed
- No alpha channel
- Test on physical devices (not just simulator)
- Use Xcode's Asset Catalog for best results

---

## Android Applications

### App Icon Sizes (Density Buckets)

| Size (px) | Density | Scale | Use Case | Priority |
|-----------|---------|-------|----------|----------|
| 192×192 | xxxhdpi | 4x | High-end devices | ⭐⭐⭐ Critical |
| 144×144 | xxhdpi | 3x | Standard high-DPI | ⭐⭐⭐ Critical |
| 96×96 | xhdpi | 2x | Standard devices | ⭐⭐⭐ Critical |
| 72×72 | hdpi | 1.5x | Medium density | ⭐⭐ Important |
| 48×48 | mdpi | 1x | Low density (baseline) | ⭐⭐ Important |

### Adaptive Icons (Android 8.0+)

| Layer | Size (px) | Safe Zone | Use Case |
|-------|-----------|-----------|----------|
| Foreground | 108×108 | Inner 72×72 | Icon graphic |
| Background | 108×108 | Full canvas | Background color/image |

### Directory Structure
```
res/
  mipmap-mdpi/
    ic_launcher.png (48×48)
  mipmap-hdpi/
    ic_launcher.png (72×72)
  mipmap-xhdpi/
    ic_launcher.png (96×96)
  mipmap-xxhdpi/
    ic_launcher.png (144×144)
  mipmap-xxxhdpi/
    ic_launcher.png (192×192)
  mipmap-anydpi-v26/
    ic_launcher.xml (Adaptive icon definition)
  drawable/
    ic_launcher_foreground.xml
    ic_launcher_background.xml
```

### Implementation Notes
- Adaptive icons are preferred for Android 8.0+
- Provide both legacy and adaptive versions
- Safe zone: center 66% of icon (to avoid cropping)
- Test across different launcher shapes (circle, squircle, rounded square)
- No transparency on background layer

---

## UI Icons

### Toolbar & Interface Icons

| Size (px) | Use Case | File Format | Priority |
|-----------|----------|-------------|----------|
| 24×24 | Toolbar / Navbar icon | .png, .svg | ⭐⭐⭐ Critical |
| 32×32 | Sidebar / Medium icon | .png, .svg | ⭐⭐ Important |
| 48×48 | Large button icon | .png, .svg | ⭐⭐ Important |
| 64×64 | Extra large icon | .png, .svg | ⭐ Optional |

### Material Design Icon Grid
- Icon size: 24×24 dp (default)
- Key shapes: Circle (20dp), Square (18dp), Rectangle (20×18 dp)
- Line weight: 2 dp
- Corner radius: 2 dp

### Implementation Notes
- Use SVG for scalability when possible
- Provide @1x, @2x, @3x PNG alternatives
- Maintain optical balance across sizes
- Use consistent stroke width and style
- Test against light and dark backgrounds

---

## Illustrations & Splash Screens

### Splash Screen Sizes

| Size (px) | Aspect Ratio | Use Case | Priority |
|-----------|--------------|----------|----------|
| 2732×2732 | 1:1 | iPad Pro (12.9") | ⭐⭐ Important |
| 2048×2732 | 3:4 | iPad Pro portrait | ⭐⭐ Important |
| 1668×2388 | ~3:4 | iPad Pro 11" | ⭐⭐ Important |
| 1242×2688 | 9:19.5 | iPhone Max | ⭐⭐⭐ Critical |
| 1125×2436 | ~9:19.5 | iPhone X/XS/11 Pro | ⭐⭐⭐ Critical |
| 1080×1920 | 9:16 | Android portrait | ⭐⭐⭐ Critical |
| 1920×1080 | 16:9 | Android landscape | ⭐⭐ Important |

### Illustration Sizes

| Size (px) | Aspect Ratio | Use Case | Priority |
|-----------|--------------|----------|----------|
| 800×600 | 4:3 | Empty state illustration | ⭐⭐ Important |
| 1200×1200 | 1:1 | Social media posts | ⭐⭐ Important |
| 1920×1080 | 16:9 | Web hero banner | ⭐⭐ Important |

### Implementation Notes
- Use vector formats (SVG) when possible
- Provide multiple resolutions for different devices
- Keep file sizes reasonable (use compression)
- Test on actual device screens
- Consider safe zones for device notches/cutouts

---

## Quick Reference Chart

### Priority Sizes (Must Have)

**Windows**: 256, 128, 64, 48, 32, 16
**macOS**: 1024, 512, 256, 128
**Web**: 32, 16 (favicon), 180 (Apple Touch)
**PWA**: 512, 192
**Chrome Extension**: 128, 48, 32, 16
**iOS**: 1024, 180, 120
**Android**: 192, 144, 96, 72, 48

### File Size Guidelines

| Icon Size | Target File Size |
|-----------|------------------|
| 16×16 to 32×32 | <10 KB |
| 48×48 to 64×64 | 10–30 KB |
| 96×96 to 128×128 | 20–60 KB |
| 192×192 to 256×256 | 30–100 KB |
| 512×512 | 100–200 KB |
| 1024×1024+ | 200–400 KB |

---

## Testing Checklist

### Visual Testing
- [ ] Check clarity at 16×16 (minimum size)
- [ ] Verify contrast against light background
- [ ] Verify contrast against dark background
- [ ] Test in grayscale (ensure recognizable)
- [ ] Confirm no fine details lost at small sizes

### Technical Testing
- [ ] Verify file sizes within targets
- [ ] Check alpha channel / transparency
- [ ] Confirm proper file formats
- [ ] Test on actual devices/platforms
- [ ] Validate with platform-specific tools

### Platform Testing
- [ ] Windows: Test in Explorer, taskbar, system tray
- [ ] macOS: Test in Finder, dock, launchpad
- [ ] Web: Test in Chrome, Firefox, Safari tabs
- [ ] iOS: Test on actual device home screen
- [ ] Android: Test on various launchers

---

## Additional Resources

- [Windows App Icon Guidelines](https://docs.microsoft.com/windows/apps/design/style/iconography)
- [Apple Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Icon Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design)
- [Material Design Icons](https://material.io/design/iconography)
- [PWA Icon Requirements](https://web.dev/add-manifest/)

---

*Last Updated: 2025-12-03*
