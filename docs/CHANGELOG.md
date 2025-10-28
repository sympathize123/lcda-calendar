# UI/UX Changelog

Date: 2025-10-27

- Added device preview wrapper (`?device=iphone-14`, etc.) to debug mobile in-editor.
- Made header responsive: flexible height, truncation, and safe stacking.
- Introduced mobile overflow menu (⋮) that contains navigation, view switch, theme, and create.
- Restyled mobile menu with subtle raised shadow and soft borders.
- Adjusted order in mobile menu: Prev/Next → Today → View Switch → Theme → New Event.
 - Added marketing placeholder page at `/club` and duplicated calendar at `/calendar` to prepare for main-site split.
- Replaced root route with new landing page (hero + gallery + CTA) aligned with minimal, image-forward aesthetic. Images are read from `public/club/hero.jpg` and `public/club/1.jpg..6.jpg` with graceful placeholders.
- Landing page restyle for rock-band vibe: dark full-bleed hero with grain overlay, marquee strip, collage grid, high-contrast CTAs.
- Added placeholder hero and 6 gallery images under `public/club/*.svg` and wired landing to use them by default.
- Replaced placeholders with representative real photos from `skku_lcda/` (most recent 7) copied to `public/club/hero.jpg` and `public/club/1.jpg..6.jpg`.
- Curated hero slideshow (video + posters) and gallery using specific assets requested:
   - Video: `skku_lcda_1645321119_2777476960342543756_51705628478.mp4` → `public/club/hero.mp4`
   - Images: `skku_lcda_1655789716_2865294270770488806_51705628478.jpg` → `public/club/poster1.jpg`
   - Images: `skku_lcda_1655789153_2865289551935192989_51705628478.jpg` → `public/club/poster2.jpg`
   - Config: `src/features/site/curation.ts` controls order/rotation.
- Added automated curation script to pick high-contrast, non-green images (`scripts/select-rock-images.js`) and populated `public/club/1..6.jpg` accordingly using sharp-based heuristics.
 - Added grayscale hero image from `skku_lcda_1750050416_3656010332541477780_51705628478.jpg` → `public/club/hero_bw.jpg` and inserted into hero slideshow.

Notes:
- The repository’s `LCDA_calendar_plan.docx` is not auto-updated by code changes. This markdown changelog records ongoing tweaks so you can later merge them into the docx.
