# Images

Optional assets for the site.

| File | Used for | Notes |
|---|---|---|
| `og-cover.png` | Social sharing preview (Open Graph / Twitter card) | 1200 x 630 px recommended. Referenced from `index.html`. |
| Project figures | Project detail pages | Reference them from `data/project-details.json` as `../assets/images/<file>`. |

Keep images compressed. The site is otherwise dependency-free and loads in well
under a second; a single uncompressed photograph would undo that.
