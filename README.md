# Euro Performance - Marketing Site

## How to preview
- Open `index.html` directly in your browser (double-click is fine). No build step required.

## How to add or replace images
1. Drop images into `assets/` (recommended) or `galery/`.
2. Open `app.js` and update `IMAGE_MANIFEST` near the top with your filenames or paths.

Example:
```js
const IMAGE_MANIFEST = [
  "assets/shop-front.jpg",
  "assets/gallery/before-brakes.jpg",
  "assets/gallery/after-brakes.jpg"
];
```

Notes:
- The script also checks common filenames automatically, but adding a manifest is the most reliable.
- If you want a specific hero image, put it first in `IMAGE_MANIFEST` and use a filename that includes words like `shop`, `front`, or `car`.

## How to change phone, address, hours, email
Edit these in `index.html`:
- Phone number and tel link: search for `(407) 204-0026` and `tel:+14072040026`.
- Email: search for `service@pn-auto.example`.
- Hours: search for `Mon-Fri 8:00 AM-6:00 PM (placeholder)`.
- Address and map link: search for `1234 Placeholder Ave` and update the `Open in Maps` link.

## How to change reviews
- Replace the review cards inside the `#reviews` section in `index.html`.
- Each review is a `<article class="card">` block.

## Deploy (optional)
Vercel:
- Create a new project and select this folder as the root. Deploy as a static site.

Netlify:
- Drag and drop the folder in the Netlify dashboard, or create a new site from this folder.

## Image detection behavior
- `app.js` tries `IMAGE_MANIFEST` first, then falls back to common filenames.
- If no images are found, the site shows clean SVG placeholders with instructions.


