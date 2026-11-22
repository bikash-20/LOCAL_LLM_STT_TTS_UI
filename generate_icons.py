import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_icons():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "public")
    os.makedirs(output_dir, exist_ok=True)

    # 1. First, create master SVG (crisp, scalable vector)
    # The SVG contains the vector sakura flower, radiant pistils/stamens, and 'Swasti AI' text
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141522" />
      <stop offset="100%" stop-color="#0E0F16" />
    </linearGradient>

    <!-- Outer Border Subtle Glow -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9CAF88" stop-opacity="0.4" />
      <stop offset="50%" stop-color="#E8412C" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#FF8DA1" stop-opacity="0.5" />
    </linearGradient>

    <!-- Ambient Aura -->
    <radialGradient id="auraGrad" cx="50%" cy="44%" r="40%">
      <stop offset="0%" stop-color="#FF8DA1" stop-opacity="0.25" />
      <stop offset="50%" stop-color="#E8412C" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#141522" stop-opacity="0" />
    </radialGradient>

    <!-- Sakura Petal Gradient -->
    <linearGradient id="petalGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#E8412C" />
      <stop offset="40%" stop-color="#F43F5E" />
      <stop offset="85%" stop-color="#FFA8BA" />
      <stop offset="100%" stop-color="#FFE4E8" />
    </linearGradient>

    <!-- Petal Highlight Overlay -->
    <linearGradient id="petalHighlight" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0" />
      <stop offset="80%" stop-color="#FFFFFF" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.6" />
    </linearGradient>

    <!-- Center Radiant Core -->
    <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFBEB" />
      <stop offset="35%" stop-color="#FCD34D" />
      <stop offset="70%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#DC2626" />
    </radialGradient>

    <!-- Single Notched Sakura Petal Definition -->
    <path id="sakuraPetal" d="
      M 0 0 
      C -36 -35, -78 -90, -78 -145
      C -78 -180, -48 -210, -18 -204
      C -6 -202, 0 -188, 0 -188
      C 0 -188, 6 -202, 18 -204
      C 48 -210, 78 -180, 78 -145
      C 78 -90, 36 -35, 0 0 Z
    " />

    <filter id="shadowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Background Base with Rounded Corners -->
  <rect x="8" y="8" width="496" height="496" rx="116" fill="url(#bgGrad)" stroke="url(#borderGrad)" stroke-width="4" />

  <!-- Ambient Glow Behind Flower -->
  <circle cx="256" cy="225" r="170" fill="url(#auraGrad)" />

  <!-- Sakura Blossom Group -->
  <g transform="translate(256, 225)" filter="url(#shadowFilter)">
    <!-- 5 Radial Petals (Angles: 0, 72, 144, 216, 288 deg, rotated -18deg for symmetry) -->
    <g transform="rotate(-18)">
      <use href="#sakuraPetal" fill="url(#petalGrad)" />
      <use href="#sakuraPetal" fill="url(#petalHighlight)" />
    </g>
    <g transform="rotate(54)">
      <use href="#sakuraPetal" fill="url(#petalGrad)" />
      <use href="#sakuraPetal" fill="url(#petalHighlight)" />
    </g>
    <g transform="rotate(126)">
      <use href="#sakuraPetal" fill="url(#petalGrad)" />
      <use href="#sakuraPetal" fill="url(#petalHighlight)" />
    </g>
    <g transform="rotate(198)">
      <use href="#sakuraPetal" fill="url(#petalGrad)" />
      <use href="#sakuraPetal" fill="url(#petalHighlight)" />
    </g>
    <g transform="rotate(270)">
      <use href="#sakuraPetal" fill="url(#petalGrad)" />
      <use href="#sakuraPetal" fill="url(#petalHighlight)" />
    </g>

    <!-- Stamens and Golden Anthers -->
    <!-- Stamen rays -->
    <g stroke="#FCD34D" stroke-width="2.5" stroke-linecap="round" opacity="0.9">
      <!-- 10 radial stamens -->
      <line x1="0" y1="0" x2="0" y2="-45" />
      <line x1="0" y1="0" x2="26" y2="-36" />
      <line x1="0" y1="0" x2="42" y2="-14" />
      <line x1="0" y1="0" x2="42" y2="14" />
      <line x1="0" y1="0" x2="26" y2="36" />
      <line x1="0" y1="0" x2="0" y2="45" />
      <line x1="0" y1="0" x2="-26" y2="36" />
      <line x1="0" y1="0" x2="-42" y2="14" />
      <line x1="0" y1="0" x2="-42" y2="-14" />
      <line x1="0" y1="0" x2="-26" y2="-36" />
    </g>

    <!-- Golden Anther dots -->
    <g fill="#FDE047" stroke="#F59E0B" stroke-width="1.5">
      <circle cx="0" cy="-45" r="5" />
      <circle cx="26" cy="-36" r="5" />
      <circle cx="42" cy="-14" r="5" />
      <circle cx="42" cy="14" r="5" />
      <circle cx="26" cy="36" r="5" />
      <circle cx="0" cy="45" r="5" />
      <circle cx="-26" cy="36" r="5" />
      <circle cx="-42" cy="14" r="5" />
      <circle cx="-42" cy="-14" r="5" />
      <circle cx="-26" cy="-36" r="5" />
    </g>

    <!-- Central Pistil Star Core -->
    <circle cx="0" cy="0" r="22" fill="url(#coreGrad)" />
    <circle cx="0" cy="0" r="10" fill="#FFFBEB" opacity="0.95" />
  </g>

  <!-- Typography: SWASTI AI -->
  <g text-anchor="middle">
    <!-- Main text 'Swasti AI' -->
    <text 
      x="256" 
      y="435" 
      font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Outfit', 'Segoe UI', Roboto, sans-serif" 
      font-size="44" 
      font-weight="800" 
      letter-spacing="5" 
      fill="#F7F5EF"
    >SWASTI AI</text>

    <!-- Subtle Subtitle/Accent -->
    <text 
      x="256" 
      y="464" 
      font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" 
      font-size="14" 
      font-weight="700" 
      letter-spacing="6" 
      fill="#9CAF88" 
      opacity="0.9"
    >VOICE &amp; CHAT</text>
  </g>
</svg>"""

    svg_path = os.path.join(output_dir, "favicon.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Wrote master SVG: {svg_path}")

    # 2. Render High-Resolution Raster Icons with Pillow using 4x supersampling for flawless quality
    render_size = 2048
    scale = render_size / 512.0

    img = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background rounded rectangle
    # Radius = 116 * scale = 464
    rx = int(116 * scale)
    pad = int(8 * scale)
    rect_box = [pad, pad, render_size - pad, render_size - pad]

    # Draw dark background
    draw.rounded_rectangle(rect_box, radius=rx, fill=(18, 19, 28, 255), outline=(156, 175, 136, 100), width=int(5 * scale))

    # Draw radial glow in center
    cx, cy = int(256 * scale), int(225 * scale)
    glow_radius = int(180 * scale)
    glow_img = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    for r in range(glow_radius, 0, -int(4 * scale)):
        alpha = int(45 * (1.0 - r / glow_radius))
        glow_draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 141, 161, alpha))
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=int(25 * scale)))
    img = Image.alpha_composite(img, glow_img)
    draw = ImageDraw.Draw(img)

    # Draw 5 Petals of Sakura
    petal_len = 195 * scale
    petal_half_w = 78 * scale

    for i in range(5):
        angle_deg = -18 + i * 72
        angle_rad = math.radians(angle_deg)
        cos_a = math.cos(angle_rad)
        sin_a = math.sin(angle_rad)

        # Generate smooth points for each petal
        petal_pts = []
        # Center to tip left curve, notch, tip right curve back to center
        # We sample parametric curve for exquisite notch detail
        # Left side
        for t in range(0, 101, 5):
            frac = t / 100.0
            # Width widens then tapers to notch
            w = -petal_half_w * math.sin(frac * math.pi * 0.85)
            h = -petal_len * frac
            # Notch at the tip (frac near 1.0)
            if frac > 0.85:
                notch_depth = (frac - 0.85) / 0.15
                w *= (1.0 - notch_depth * 0.25)
            # Rotate by angle
            px = cx + (w * cos_a - h * sin_a)
            py = cy + (w * sin_a + h * cos_a)
            petal_pts.append((px, py))

        # Notch point in middle
        notch_h = -petal_len * 0.90
        petal_pts.append((cx - notch_h * sin_a, cy + notch_h * cos_a))

        # Right side
        for t in range(100, -1, -5):
            frac = t / 100.0
            w = petal_half_w * math.sin(frac * math.pi * 0.85)
            h = -petal_len * frac
            if frac > 0.85:
                notch_depth = (frac - 0.85) / 0.15
                w *= (1.0 - notch_depth * 0.25)
            px = cx + (w * cos_a - h * sin_a)
            py = cy + (w * sin_a + h * cos_a)
            petal_pts.append((px, py))

        # Fill petal with gradient or solid smooth vibrant coral-rose
        draw.polygon(petal_pts, fill=(244, 63, 94, 250), outline=(255, 175, 190, 240))

        # Inner lighter lobe highlight
        inner_pts = []
        for (px, py) in petal_pts:
            ix = cx + (px - cx) * 0.82
            iy = cy + (py - cy) * 0.82
            inner_pts.append((ix, iy))
        draw.polygon(inner_pts, fill=(255, 140, 160, 180))

    # Stamens and golden anthers
    num_stamens = 10
    stamen_len = 50 * scale
    for j in range(num_stamens):
        s_angle = math.radians(j * (360 / num_stamens))
        sx = cx + math.cos(s_angle) * stamen_len
        sy = cy + math.sin(s_angle) * stamen_len
        draw.line([cx, cy, sx, sy], fill=(252, 211, 77, 240), width=int(4 * scale))
        anther_r = int(7 * scale)
        draw.ellipse([sx - anther_r, sy - anther_r, sx + anther_r, sy + anther_r], fill=(253, 224, 71, 255), outline=(245, 158, 11, 255), width=int(2 * scale))

    # Core center pistil
    core_r = int(24 * scale)
    draw.ellipse([cx - core_r, cy - core_r, cx + core_r, cy + core_r], fill=(220, 38, 38, 255), outline=(245, 158, 11, 255), width=int(3 * scale))
    draw.ellipse([cx - core_r//2, cy - core_r//2, cx + core_r//2, cy + core_r//2], fill=(255, 251, 235, 255))

    # Typography: SWASTI AI
    # Try finding font
    font_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    if not os.path.exists(font_path):
        font_path = "/System/Library/Fonts/Helvetica.ttc"

    try:
        font_main = ImageFont.truetype(font_path, int(46 * scale))
        font_sub = ImageFont.truetype(font_path, int(15 * scale))
    except Exception:
        font_main = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    # Draw "SWASTI AI" text with letter spacing
    text_main = "SWASTI AI"
    # Measure
    bbox = draw.textbbox((0, 0), text_main, font=font_main)
    w_text = bbox[2] - bbox[0]
    tx = (render_size - w_text) // 2
    ty = int(405 * scale)
    draw.text((tx, ty), text_main, font=font_main, fill=(247, 245, 239, 255))

    # Draw subtitle "VOICE & CHAT"
    text_sub = "VOICE & CHAT"
    bbox_sub = draw.textbbox((0, 0), text_sub, font=font_sub)
    w_sub = bbox_sub[2] - bbox_sub[0]
    sx = (render_size - w_sub) // 2
    sy = int(452 * scale)
    draw.text((sx, sy), text_sub, font=font_sub, fill=(156, 175, 136, 230))

    # 3. Export PNG targets with LANCZOS downsampling for supreme crispness
    sizes = {
        "pwa-512x512.png": (512, 512),
        "pwa-192x192.png": (192, 192),
        "apple-touch-icon.png": (180, 180),
        "apple-touch-icon-180x180.png": (180, 180),
        "apple-touch-icon-152x152.png": (152, 152),
        "apple-touch-icon-120x120.png": (120, 120),
        "favicon-32x32.png": (32, 32),
        "favicon-16x16.png": (16, 16)
    }

    for filename, (w, h) in sizes.items():
        resized = img.resize((w, h), Image.Resampling.LANCZOS)
        out_path = os.path.join(output_dir, filename)
        resized.save(out_path, "PNG", optimize=True)
        print(f"Generated icon: {out_path} ({w}x{h})")

    # Maskable Icon with safe margins (40% inner padding so Android adaptive icons never crop)
    maskable_size = 512
    maskable_img = Image.new("RGBA", (maskable_size, maskable_size), (18, 19, 28, 255))
    inner = img.resize((int(maskable_size * 0.8), int(maskable_size * 0.8)), Image.Resampling.LANCZOS)
    offset = int(maskable_size * 0.1)
    maskable_img.paste(inner, (offset, offset), inner)
    maskable_path = os.path.join(output_dir, "maskable-icon-512x512.png")
    maskable_img.save(maskable_path, "PNG", optimize=True)
    print(f"Generated maskable icon: {maskable_path}")

    # Favicon .ico
    ico_path = os.path.join(output_dir, "favicon.ico")
    ico_img = img.resize((64, 64), Image.Resampling.LANCZOS)
    ico_img.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print(f"Generated favicon.ico: {ico_path}")

if __name__ == "__main__":
    create_icons()
