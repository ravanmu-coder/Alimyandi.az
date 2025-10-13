# Rebranding Changelog: Autoria → Əlimyandı.az

## Overview
This document tracks all changes made during the rebranding from "Autoria" to "Əlimyandı.az". Only user-facing display elements were changed - no code logic, namespaces, API routes, or backend identifiers were modified.

## Files Modified

### 1. HTML and Meta Tags
- **index.html**
  - `Old`: `<title>Autoria Auction Platform</title>`
  - `New`: `<title>Əlimyandı.az Auction Platform</title>`
  - `Old`: `<link rel="icon" type="image/svg+xml" href="/vite.svg" />`
  - `New`: `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`
  - Added: Meta tags for social sharing (og:title, og:image, twitter:card, etc.)

### 2. Language Files
- **src/hooks/useLanguage.tsx**
  - `Old`: `'nav.logo': 'Autoria',`
  - `New`: `'nav.logo': 'Əlimyandı.az',` (2 occurrences)
  - `Old`: `'footer.copyright': '© 2024 Autoria. Bütün hüquqlar qorunur.',`
  - `New`: `'footer.copyright': '© 2024 Əlimyandı.az. Bütün hüquqlar qorunur.',`
  - `Old`: `'footer.copyright': '© 2024 Autoria. All rights reserved.',`
  - `New`: `'footer.copyright': '© 2024 Əlimyandı.az. All rights reserved.',`

### 3. Documentation Files
- **src/mock-data/README.md**
  - `Old`: `# Mock Data for Autoria Auction API`
  - `New`: `# Mock Data for Əlimyandı.az Auction API`
  - `Old`: `Bu klasör Autoria Auction API-si üçün bütün endpoint-lər üçün mock data ehtiva edir.`
  - `New`: `Bu klasör Əlimyandı.az Auction API-si üçün bütün endpoint-lər üçün mock data ehtiva edir.`

### 4. Mock Data Files
- **src/mock-data/api-responses.ts**
  - `Old`: `title: "Autoria Auction API",`
  - `New`: `title: "Əlimyandı.az Auction API",`

- **src/mock-data/info-mock-data.ts**
  - `Old`: `title: "Autoria Auction API",`
  - `New`: `title: "Əlimyandı.az Auction API",`

### 5. Package Configuration
- **package.json**
  - `Old`: `"name": "vite-react-typescript-starter",`
  - `New`: `"name": "əlimyandı-auction-platform",`

## New Logo Assets Created

### SVG Logos
- **public/logo-primary.svg** - Full wordmark with icon (200x60)
- **public/logo-icon.svg** - Icon only (60x60)
- **public/logo-primary-light.svg** - Light theme wordmark (200x60)
- **public/logo-icon-light.svg** - Light theme icon (60x60)
- **public/favicon.svg** - Favicon version (32x32)

### Logo Design Elements
- **Icon**: Stylized gavel with hand element representing auctions and "hand" (Əlimyandı)
- **Colors**: 
  - Primary Blue: #1E88FF
  - Primary Purple: #7C3AED
  - Accent Gold: #F6C85F
  - Dark Card: #0B1220
- **Typography**: Inter font family, condensed for wordmark
- **Domain**: ".az" displayed in smaller, lighter color

## Files Intentionally NOT Modified

The following files were intentionally left unchanged to preserve code functionality:

- **Code namespaces** (C# namespaces, TypeScript interfaces)
- **API routes** (/api/Auction, /api/Car, etc.)
- **Database identifiers** and table names
- **Build scripts** and configuration files
- **Component class names** and function names
- **Environment variables** and configuration keys
- **Backend controller names** and method names

## Accessibility Updates

All new logo assets include:
- Proper `alt` attributes: `alt="Əlimyandı.az logo"`
- `aria-label` attributes: `aria-label="Əlimyandı.az"`
- High contrast ratios for accessibility compliance

## Testing Checklist

- [ ] Logo displays correctly in header
- [ ] Favicon appears in browser tab
- [ ] Social sharing shows correct title and image
- [ ] Language switching works with new brand name
- [ ] Footer copyright displays new brand name
- [ ] All logo variants render properly (light/dark themes)

## Commit Information

**Commit Message**: `chore(rebrand): change display name to "Əlimyandı.az" and update logo assets`

**Files Changed**: 8 files modified, 5 new logo assets created
**Lines Changed**: ~15 lines modified (display text only)
**Assets Created**: 5 SVG logo files

## Rollback Instructions

To revert this rebranding:
1. Restore all modified files from git history
2. Delete new logo assets from public/ folder
3. Restore original favicon reference in index.html
4. Revert package.json name field

---

**Note**: This rebranding affects only user-facing elements. All backend functionality, API endpoints, and code logic remain unchanged.

