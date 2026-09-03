# EMH Brand Assets

The EMH monogram is **Engineer Muhammad Hamza's own artwork**. Everything in this
folder is derived from that single supplied mark — the vector files are a
measured, 1:1 trace of it, not a redraw. Do not redesign, restyle or
"improve" the geometry.

## Reading the mark

| Letter | Element |
|---|---|
| **M** | the two outer brackets — each a stem with two 45° diagonals folding inward |
| **E** | the three horizontal bars stacked between the brackets |
| **H** | the two stems tied together by the centre bar |

Each bracket is drawn as one continuous stroke: inner tip → 45° diagonal →
large rounded corner → stem → large rounded corner → 45° diagonal → inner tip.
The two inner tips stop short of meeting, leaving the counter open. Round caps,
no fills, no enclosure — a technical layout, not a typographic logotype.

## Construction grid

All vector files share one coordinate system:

```
viewBox           0 0 674 434
stroke-width      20.5
stroke-linecap    round
stroke-linejoin   round
corner radius     37.4 (centreline)

left  bracket  M198.5 147 L83.8 32.4
               A37.4 37.4 0 0 0 20 58.8
               L20 375.2
               A37.4 37.4 0 0 0 83.8 401.6
               L197.5 287

right bracket  M475.5 147 L589.7 32.4
               A37.4 37.4 0 0 1 653.5 58.8
               L653.5 375.2
               A37.4 37.4 0 0 1 589.7 401.6
               L476.5 287

top    bar     M248 29  H425
centre bar     M248 215 H425
bottom bar     M248 400 H425
```

Verified against the supplied artwork at 94.6% pixel IoU — the residual is
antialiasing along the stroke edges only.

## Colour

| Token | Value | Use |
|---|---|---|
| Copper (top of gradient) | `#EBA14D` | start of the vertical mark gradient |
| Copper (bottom of gradient) | `#C66D27` | end of the vertical mark gradient |
| Copper (flat) | `#C2683A` | single-ink reproduction |
| Copper lift | `#E0894F` | interaction / small sizes on dark |
| Graphite | `#171614` | primary dark ground, mono mark on light |
| Warm ivory | `#F5F1EA` | primary light ground |

The gradient runs top-to-bottom and is declared with
`gradientUnits="userSpaceOnUse"`. This is **required** — an
`objectBoundingBox` gradient collapses on the perfectly vertical and
horizontal strokes and they disappear.

## Files

| File | Contents |
|---|---|
| `emh-mark.svg` | mark in `currentColor` — for inline use where CSS sets the colour |
| `emh-logo-dark.svg` | copper gradient, transparent — for dark grounds |
| `emh-logo-light.svg` | copper gradient, transparent — for light grounds |
| `emh-logo-accent.svg` | flat `#C2683A` — single-ink reproduction |
| `emh-logo-mono.svg` | flat graphite `#171614` — print / one-colour on light |
| `favicon.svg` | copper mark on a graphite tile, 674 × 674 |
| `og-cover.png` | 1200 × 630 social preview |
| `emh-avatar.png` | 1024 × 1024 square lockup on graphite — profile / avatar image |
| `emh-logo-original.png` | the original supplied artwork, 1254 × 1254 (kept in the author's local working folder, not in the repository) |

## Usage rules

- Keep clear space of at least one stroke-width (20 units) on every side.
- Minimum width 32 px on screen; below that the three bars close up.
- Never rotate, skew, outline, add a drop shadow, or place the mark on a busy
  photograph.
- Never close the gap between the inner tips, tighten the corner radius, or
  re-space the bars — those proportions are the mark.
- On light grounds use the copper gradient or `emh-logo-mono.svg`; do not
  invert the mark to white on ivory.
