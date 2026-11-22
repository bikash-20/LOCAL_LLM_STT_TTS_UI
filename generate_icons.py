import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_3d_petal(petal_len, petal_w):
    """
    Generate a photorealistic 3D sakura petal with Blinn-Phong lighting,
    specular highlight, surface curvature, and classic notched tip.
    """
    w = int(petal_w * 2.3)
    h = int(petal_len * 1.35)
    cx = w // 2
    base_y = int(petal_len * 1.18)

    Y, X = np.ogrid[:h, :w]
    dx = (X - cx) / float(petal_w)
    dy = (base_y - Y) / float(petal_len)

    valid = (dy >= 0) & (dy <= 1.06)
    width_profile = np.sin(np.clip(dy, 0, 1) * math.pi * 0.86)

    # Notch indentation at tip (around dy ~ 1.0)
    notch = np.where((dy > 0.82) & (np.abs(dx) < 0.38), (1.0 - (np.abs(dx) / 0.38)) * 0.17, 0.0)
    max_dy = 1.03 - notch
    inside = valid & (dy <= max_dy) & (np.abs(dx) <= (width_profile * 1.06))

    # 3D Heightmap Z
    z_long = np.sin(np.clip(dy, 0, 1) * math.pi * 0.74)
    z_trans = np.cos(np.clip(dx / (width_profile + 1e-5), -1, 1) * (math.pi / 2.0))
    midrib = 0.14 * (1.0 - np.exp(-(dx * 5.5)**2))

    Z = np.where(inside, (z_long * (z_trans * 0.82 + 0.18) - midrib), 0.0)
    Z = np.clip(Z, 0, 1.0)

    # Gradients for surface normals
    dZ_dy, dZ_dx = np.gradient(Z)
    dZ_dx *= 3.8
    dZ_dy *= 3.8

    norm = np.sqrt(dZ_dx**2 + dZ_dy**2 + 1.0)
    Nx = -dZ_dx / norm
    Ny = dZ_dy / norm
    Nz = 1.0 / norm

    # Top-Left studio key light (elevation 48 deg, azimuth -45 deg)
    L = np.array([-0.55, 0.65, 0.52])
    L = L / np.linalg.norm(L)

    diff = np.clip(Nx * L[0] + Ny * L[1] + Nz * L[2], 0, 1.0)

    # Specular shine
    H = L + np.array([0, 0, 1.0])
    H = H / np.linalg.norm(H)
    spec = np.clip(Nx * H[0] + Ny * H[1] + Nz * H[2], 0, 1.0) ** 16

    # Rich natural color gradient:
    # Deep ruby/crimson coral base -> luminous velvety sakura pink -> soft pearlescent blush tip
    t_color = np.clip(dy * 1.08, 0, 1)
    base_r = 215 * (1 - t_color) + 254 * t_color
    base_g = 25 * (1 - t_color) + 125 * t_color
    base_b = 68 * (1 - t_color) + 155 * t_color

    ambient = 0.40
    light_total = ambient + (1.0 - ambient) * diff

    R = np.clip(base_r * light_total + 255 * spec * 0.85, 0, 255)
    G = np.clip(base_g * light_total + 235 * spec * 0.85, 0, 255)
    B = np.clip(base_b * light_total + 242 * spec * 0.85, 0, 255)

    alpha = np.where(inside, 255, 0).astype(np.uint8)

    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[..., 0] = R.astype(np.uint8)
    rgba[..., 1] = G.astype(np.uint8)
    rgba[..., 2] = B.astype(np.uint8)
    rgba[..., 3] = alpha

    petal_img = Image.fromarray(rgba, mode="RGBA")
    alpha_img = petal_img.split()[3].filter(ImageFilter.GaussianBlur(radius=1.4))
    petal_img.putalpha(alpha_img)

    return petal_img, cx, base_y


def generate_3d_icons():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "public")
    os.makedirs(output_dir, exist_ok=True)

    # High-resolution rendering at 2048x2048 (4x supersampling for 512x512)
    render_size = 2048
    scale = render_size / 512.0

    # 1. FULL BLEED SOLID BACKGROUND (NO TRANSPARENT CORNERS)
    # This completely eliminates macOS Chrome's artificial white squircle card
    img = Image.new("RGBA", (render_size, render_size), (15, 16, 25, 255))
    draw = ImageDraw.Draw(img)

    # Deep obsidian gradient from #18192A at top to #0B0C13 at bottom
    for y in range(render_size):
        t = y / float(render_size)
        r = int(24 * (1 - t) + 10 * t)
        g = int(26 * (1 - t) + 11 * t)
        b = int(42 * (1 - t) + 18 * t)
        draw.line([(0, y), (render_size, y)], fill=(r, g, b, 255))

    # Top edge subtle 3D rim highlight (Apple macOS signature specular highlight)
    for y in range(int(4 * scale)):
        alpha = int(110 * (1 - y / (4 * scale)))
        draw.line([(0, y), (render_size, y)], fill=(255, 255, 255, alpha))

    # Ambient radial warm glow behind flower
    cx = render_size // 2
    cy = int(render_size * 0.42)
    glow_radius = int(250 * scale)
    glow_img = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    for r in range(glow_radius, 0, -int(4 * scale)):
        factor = 1.0 - (r / glow_radius)
        alpha = int(60 * (factor ** 1.9))
        glow_draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 80, 115, alpha))
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=int(32 * scale)))
    img = Image.alpha_composite(img, glow_img)

    # 2. RENDER 3D BLOSSOM
    petal_len = int(195 * scale)
    petal_w = int(82 * scale)
    petal_master, pcx, pbase_y = create_3d_petal(petal_len, petal_w)

    flower_layer = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))

    # 5 Petals arranged in circle with realistic 3D overlap and contact shadows
    num_petals = 5
    for i in range(num_petals):
        angle_deg = -18 + i * 72

        # Rotate petal around its base (pcx, pbase_y)
        # To do this cleanly, create a larger canvas, place petal with base at center, then rotate
        p_canvas_size = int(petal_len * 2.8)
        p_canvas = Image.new("RGBA", (p_canvas_size, p_canvas_size), (0, 0, 0, 0))
        paste_x = p_canvas_size // 2 - pcx
        paste_y = p_canvas_size // 2 - pbase_y
        p_canvas.paste(petal_master, (paste_x, paste_y), petal_master)

        # Rotate
        rotated_petal = p_canvas.rotate(-angle_deg, resample=Image.Resampling.BICUBIC)

        # Subtle petal drop shadow
        shadow_canvas = Image.new("RGBA", (p_canvas_size, p_canvas_size), (0, 0, 0, 0))
        r_alpha = rotated_petal.split()[3]
        black_fill = Image.new("RGBA", (p_canvas_size, p_canvas_size), (0, 0, 0, 140))
        shadow_canvas.paste(black_fill, (0, 0), r_alpha)
        shadow_canvas = shadow_canvas.filter(ImageFilter.GaussianBlur(radius=int(10 * scale)))

        # Paste shadow slightly offset
        s_offset_x = int(cx - p_canvas_size // 2 + 6 * scale)
        s_offset_y = int(cy - p_canvas_size // 2 + 12 * scale)
        flower_layer.paste(shadow_canvas, (s_offset_x, s_offset_y), shadow_canvas)

        # Paste petal
        offset_x = cx - p_canvas_size // 2
        offset_y = cy - p_canvas_size // 2
        flower_layer.paste(rotated_petal, (offset_x, offset_y), rotated_petal)

    # Combined flower drop shadow on background tile
    flower_shadow = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    f_alpha = flower_layer.split()[3]
    f_shadow_color = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 160))
    flower_shadow.paste(f_shadow_color, (0, 0), f_alpha)
    flower_shadow = flower_shadow.filter(ImageFilter.GaussianBlur(radius=int(22 * scale)))

    # Composite flower shadow then flower
    img.paste(flower_shadow, (int(4 * scale), int(18 * scale)), flower_shadow)
    img = Image.alpha_composite(img, flower_layer)

    # 3. 3D GOLDEN STAMENS & PEARL ANTHERS
    stamen_layer = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(stamen_layer)

    num_stamens = 12
    stamen_len = 54 * scale
    anther_radius = int(8.5 * scale)

    for j in range(num_stamens):
        angle_rad = math.radians(j * (360 / num_stamens) + 15)
        sx = cx + math.cos(angle_rad) * stamen_len
        sy = cy + math.sin(angle_rad) * stamen_len

        # Golden filament line with drop shadow
        s_draw.line([cx, cy, sx, sy], fill=(245, 158, 11, 230), width=int(4 * scale))

        # 3D Pearl Anther Bead (Spherical shading)
        # 1. Base amber bead
        s_draw.ellipse([sx - anther_radius, sy - anther_radius, sx + anther_radius, sy + anther_radius], fill=(245, 158, 11, 255), outline=(217, 119, 6, 255), width=int(1.5 * scale))
        # 2. Golden rim
        inner_r = anther_radius * 0.75
        s_draw.ellipse([sx - inner_r, sy - inner_r, sx + inner_r, sy + inner_r], fill=(252, 211, 77, 255))
        # 3. Specular highlight glint (pinpoint top-left shine)
        glint_x = sx - anther_radius * 0.35
        glint_y = sy - anther_radius * 0.35
        glint_r = anther_radius * 0.35
        s_draw.ellipse([glint_x - glint_r, glint_y - glint_r, glint_x + glint_r, glint_y + glint_r], fill=(255, 255, 250, 255))

    # Center 3D Pistil Jewel Dome
    core_r = int(26 * scale)
    # Outer ruby border
    s_draw.ellipse([cx - core_r, cy - core_r, cx + core_r, cy + core_r], fill=(190, 18, 60, 255), outline=(245, 158, 11, 255), width=int(3 * scale))
    # Mid-layer gold starburst ring
    mid_r = int(16 * scale)
    s_draw.ellipse([cx - mid_r, cy - mid_r, cx + mid_r, cy + mid_r], fill=(245, 158, 11, 255))
    # Top specular dome
    top_r = int(9 * scale)
    s_draw.ellipse([cx - top_r, cy - top_r, cx + top_r, cy + top_r], fill=(255, 251, 235, 255))

    img = Image.alpha_composite(img, stamen_layer)
    draw = ImageDraw.Draw(img)

    # 4. 3D EMBOSSED TYPOGRAPHY
    font_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    if not os.path.exists(font_path):
        font_path = "/System/Library/Fonts/Helvetica.ttc"

    try:
        font_main = ImageFont.truetype(font_path, int(48 * scale))
        font_sub = ImageFont.truetype(font_path, int(16 * scale))
    except Exception:
        font_main = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    # Draw "SWASTI AI" with 3D drop shadow
    text_main = "SWASTI AI"
    bbox = draw.textbbox((0, 0), text_main, font=font_main)
    w_text = bbox[2] - bbox[0]
    tx = (render_size - w_text) // 2
    ty = int(410 * scale)

    # Drop shadow below text
    shadow_color = (0, 0, 0, 220)
    draw.text((tx, ty + int(6 * scale)), text_main, font=font_main, fill=shadow_color)
    draw.text((tx, ty + int(3 * scale)), text_main, font=font_main, fill=(0, 0, 0, 140))
    # Crisp white face
    draw.text((tx, ty), text_main, font=font_main, fill=(247, 245, 239, 255))

    # Subtitle "VOICE & CHAT" in soft sage green with subtle shadow
    text_sub = "VOICE & CHAT"
    bbox_sub = draw.textbbox((0, 0), text_sub, font=font_sub)
    w_sub = bbox_sub[2] - bbox_sub[0]
    sx = (render_size - w_sub) // 2
    sy = int(460 * scale)

    draw.text((sx, sy + int(2 * scale)), text_sub, font=font_sub, fill=(0, 0, 0, 180))
    draw.text((sx, sy), text_sub, font=font_sub, fill=(156, 175, 136, 250))

    # 5. GENERATE CRISP FULL-BLEED MASTER SVG
    # Full bleed rect width="512" height="512" (NO transparent corners)
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Solid Full Bleed 3D Obsidian Gradient -->
    <linearGradient id="obsidianGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#18192A" />
      <stop offset="50%" stop-color="#12131F" />
      <stop offset="100%" stop-color="#0B0C13" />
    </linearGradient>

    <!-- Top Specular Rim Light -->
    <linearGradient id="rimLight" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.05" />
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.05" />
    </linearGradient>

    <!-- Ambient Blossom Glow -->
    <radialGradient id="bloomGrad" cx="50%" cy="42%" r="45%">
      <stop offset="0%" stop-color="#FF5B79" stop-opacity="0.35" />
      <stop offset="50%" stop-color="#E11D48" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#12131F" stop-opacity="0" />
    </radialGradient>

    <!-- 3D Petal Gradient -->
    <linearGradient id="petal3DGrad" x1="20%" y1="100%" x2="50%" y2="0%">
      <stop offset="0%" stop-color="#BE123C" />
      <stop offset="25%" stop-color="#E11D48" />
      <stop offset="70%" stop-color="#FB7185" />
      <stop offset="90%" stop-color="#FDA4AF" />
      <stop offset="100%" stop-color="#FFF1F2" />
    </linearGradient>

    <!-- Petal Specular Highlight -->
    <linearGradient id="petalSpecGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.55" />
      <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>

    <!-- 3D Center Core -->
    <radialGradient id="pistilGrad" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#FFFBEB" />
      <stop offset="30%" stop-color="#FCD34D" />
      <stop offset="65%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#9F1239" />
    </radialGradient>

    <radialGradient id="antherGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="25%" stop-color="#FDE047" />
      <stop offset="70%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#B45309" />
    </radialGradient>

    <!-- 3D Petal Shape with Notched Tip -->
    <path id="sakuraPetal3D" d="
      M 0 0
      C -38 -35, -82 -92, -82 -148
      C -82 -185, -50 -214, -20 -208
      C -8 -206, 0 -192, 0 -192
      C 0 -192, 8 -206, 20 -208
      C 50 -214, 82 -185, 82 -148
      C 82 -92, 38 -35, 0 0 Z
    " />

    <filter id="flower3DShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity="0.65" />
    </filter>

    <filter id="text3DShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- 1. FULL BLEED SOLID BACKGROUND (No margin, no white border on macOS) -->
  <rect width="512" height="512" fill="url(#obsidianGrad)" />

  <!-- Top Specular Rim Light -->
  <rect width="512" height="3" fill="url(#rimLight)" />

  <!-- 2. Ambient Bloom -->
  <circle cx="256" cy="216" r="210" fill="url(#bloomGrad)" />

  <!-- 3. 3D Sakura Blossom Group -->
  <g transform="translate(256, 216)" filter="url(#flower3DShadow)">
    <!-- 5 Overlapping 3D Petals with Directional Lighting -->
    <g transform="rotate(-18)">
      <use href="#sakuraPetal3D" fill="url(#petal3DGrad)" />
      <use href="#sakuraPetal3D" fill="url(#petalSpecGrad)" />
    </g>
    <g transform="rotate(54)">
      <use href="#sakuraPetal3D" fill="url(#petal3DGrad)" />
      <use href="#sakuraPetal3D" fill="url(#petalSpecGrad)" />
    </g>
    <g transform="rotate(126)">
      <use href="#sakuraPetal3D" fill="url(#petal3DGrad)" />
      <use href="#sakuraPetal3D" fill="url(#petalSpecGrad)" />
    </g>
    <g transform="rotate(198)">
      <use href="#sakuraPetal3D" fill="url(#petal3DGrad)" />
      <use href="#sakuraPetal3D" fill="url(#petalSpecGrad)" />
    </g>
    <g transform="rotate(270)">
      <use href="#sakuraPetal3D" fill="url(#petal3DGrad)" />
      <use href="#sakuraPetal3D" fill="url(#petalSpecGrad)" />
    </g>

    <!-- 3D Golden Stamens & Pearls -->
    <g stroke="#F59E0B" stroke-width="3" stroke-linecap="round" opacity="0.95">
      <line x1="0" y1="0" x2="0" y2="-48" />
      <line x1="0" y1="0" x2="25" y2="-41" />
      <line x1="0" y1="0" x2="42" y2="-24" />
      <line x1="0" y1="0" x2="48" y2="0" />
      <line x1="0" y1="0" x2="42" y2="24" />
      <line x1="0" y1="0" x2="25" y2="41" />
      <line x1="0" y1="0" x2="0" y2="48" />
      <line x1="0" y1="0" x2="-25" y2="41" />
      <line x1="0" y1="0" x2="-42" y2="24" />
      <line x1="0" y1="0" x2="-48" y2="0" />
      <line x1="0" y1="0" x2="-42" y2="-24" />
      <line x1="0" y1="0" x2="-25" y2="-41" />
    </g>

    <!-- 3D Spherical Anther Pearls -->
    <circle cx="0" cy="-48" r="7" fill="url(#antherGrad)" />
    <circle cx="25" cy="-41" r="7" fill="url(#antherGrad)" />
    <circle cx="42" cy="-24" r="7" fill="url(#antherGrad)" />
    <circle cx="48" cy="0" r="7" fill="url(#antherGrad)" />
    <circle cx="42" cy="24" r="7" fill="url(#antherGrad)" />
    <circle cx="25" cy="41" r="7" fill="url(#antherGrad)" />
    <circle cx="0" cy="48" r="7" fill="url(#antherGrad)" />
    <circle cx="-25" cy="41" r="7" fill="url(#antherGrad)" />
    <circle cx="-42" cy="24" r="7" fill="url(#antherGrad)" />
    <circle cx="-48" cy="0" r="7" fill="url(#antherGrad)" />
    <circle cx="-42" cy="-24" r="7" fill="url(#antherGrad)" />
    <circle cx="-25" cy="-41" r="7" fill="url(#antherGrad)" />

    <!-- 3D Center Jewel Dome -->
    <circle cx="0" cy="0" r="26" fill="url(#pistilGrad)" stroke="#B45309" stroke-width="2" />
    <circle cx="-3" cy="-3" r="10" fill="#FFFBEB" opacity="0.9" />
  </g>

  <!-- 4. 3D Embossed Typography -->
  <g text-anchor="middle" filter="url(#text3DShadow)">
    <text 
      x="256" 
      y="428" 
      font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Outfit', 'SF Pro Display', sans-serif" 
      font-size="46" 
      font-weight="900" 
      letter-spacing="6" 
      fill="#F7F5EF"
    >SWASTI AI</text>

    <text 
      x="256" 
      y="460" 
      font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Outfit', sans-serif" 
      font-size="15" 
      font-weight="800" 
      letter-spacing="7" 
      fill="#9CAF88" 
      opacity="0.95"
    >VOICE &amp; CHAT</text>
  </g>
</svg>"""

    svg_path = os.path.join(output_dir, "favicon.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Wrote full-bleed 3D master SVG: {svg_path}")

    # 6. EXPORT ALL PLATFORM PNG TARGETS (ALL FULL BLEED SOLID 100% OPAQUE)
    # Using Lanczos downsampling from 2048x2048 to produce crisp, anti-aliased luxury icons
    targets = {
        "pwa-512x512.png": (512, 512),
        "pwa-192x192.png": (192, 192),
        "maskable-icon-512x512.png": (512, 512),
        "apple-touch-icon.png": (180, 180),
        "apple-touch-icon-180x180.png": (180, 180),
        "apple-touch-icon-152x152.png": (152, 152),
        "apple-touch-icon-120x120.png": (120, 120),
        "favicon-32x32.png": (32, 32),
        "favicon-16x16.png": (16, 16)
    }

    # Convert to RGB (completely opaque, no alpha channel) for apple-touch-icon and pwa icons
    # Apple HIG explicitly specifies: "Do not use transparency in your app icon"
    rgb_img = img.convert("RGB")

    for filename, (tw, th) in targets.items():
        # Maskable icon gets a slightly scaled flower with full bleed background
        if filename.startswith("maskable"):
            # Resize full-bleed RGB
            m_icon = rgb_img.resize((tw, th), Image.Resampling.LANCZOS)
            out_p = os.path.join(output_dir, filename)
            m_icon.save(out_p, "PNG", optimize=True)
            print(f"Saved: {out_p} ({tw}x{th})")
        else:
            resized = rgb_img.resize((tw, th), Image.Resampling.LANCZOS)
            out_p = os.path.join(output_dir, filename)
            resized.save(out_p, "PNG", optimize=True)
            print(f"Saved: {out_p} ({tw}x{th})")

    # Multi-size Favicon .ico
    ico_path = os.path.join(output_dir, "favicon.ico")
    ico_img = rgb_img.resize((64, 64), Image.Resampling.LANCZOS)
    ico_img.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print(f"Saved: {ico_path}")

if __name__ == "__main__":
    generate_3d_icons()
