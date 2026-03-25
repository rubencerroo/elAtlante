"""
Generate all favicon assets from the restaurant's logo files.
Uses logoblack.png to create favicons with navy blue (#1e3a8a) background
and white logo, ensuring high contrast in both light and dark browser themes.
"""

from PIL import Image, ImageOps
import struct
import io
import os

# Paths
BASE_DIR = r"c:\Users\ruben\Desktop\Cosas\elAtlante\public"
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
LOGO_BLACK = os.path.join(BASE_DIR, "logoblack.png")
LOGO_WHITE = os.path.join(BASE_DIR, "logowhite.png")

# Brand color
NAVY_BLUE = (30, 58, 138)  # #1e3a8a
WHITE = (255, 255, 255)


def extract_figure(logo_path, is_white=False):
    """
    Extract just the atlas figure from the logo (right portion).
    The logo has text on the left and the figure on the right.
    """
    img = Image.open(logo_path).convert("RGBA")
    w, h = img.size

    # The figure is roughly in the right 40% of the image
    # and spans most of the height
    # Crop the figure portion
    figure_left = int(w * 0.55)
    figure = img.crop((figure_left, 0, w, h))

    # Find the bounding box of non-transparent/non-white content
    if is_white:
        # For white logo on transparent bg, find non-transparent pixels
        bbox = figure.split()[3].getbbox()  # alpha channel
    else:
        # For black logo, find non-white pixels
        # Convert to grayscale to find content
        gray = figure.convert("L")
        # Invert so content is white (high value)
        inverted = ImageOps.invert(gray)
        bbox = inverted.getbbox()

    if bbox:
        figure = figure.crop(bbox)

    return figure


def create_favicon_png(figure, size, bg_color, output_path):
    """
    Create a square PNG favicon with the figure centered on a colored background.
    Adds padding around the figure for visual breathing room.
    """
    canvas = Image.new("RGBA", (size, size), bg_color + (255,))

    # Scale figure to fit within 70% of the canvas with padding
    max_dim = int(size * 0.70)
    fig_w, fig_h = figure.size
    scale = min(max_dim / fig_w, max_dim / fig_h)
    new_w = int(fig_w * scale)
    new_h = int(fig_h * scale)

    resized = figure.resize((new_w, new_h), Image.LANCZOS)

    # Center on canvas
    x = (size - new_w) // 2
    y = (size - new_h) // 2

    canvas.paste(resized, (x, y), resized)

    # Convert to RGB for non-transparent output (favicons should have solid bg)
    final = Image.new("RGB", (size, size), bg_color)
    final.paste(canvas, (0, 0), canvas)

    final.save(output_path, "PNG", optimize=True)
    print(f"  Created: {output_path} ({size}x{size})")
    return final


def create_ico(images_dict, output_path):
    """
    Create a .ico file containing multiple sizes.
    images_dict: {size: PIL.Image}
    """
    # ICO files contain multiple BMP/PNG images
    # We'll embed PNG data for each size
    entries = []
    data_blocks = []
    offset = 6 + 16 * len(images_dict)  # header + directory entries

    for size in sorted(images_dict.keys()):
        img = images_dict[size]
        if img.mode != "RGBA":
            img = img.convert("RGBA")

        # Save as PNG to bytes
        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        png_data = buf.getvalue()

        # ICO directory entry
        w = size if size < 256 else 0
        h = size if size < 256 else 0
        entry = struct.pack("<BBBBHHII",
                            w,        # width (0 = 256)
                            h,        # height (0 = 256)
                            0,        # color palette
                            0,        # reserved
                            1,        # color planes
                            32,       # bits per pixel
                            len(png_data),  # data size
                            offset    # data offset
                            )
        entries.append(entry)
        data_blocks.append(png_data)
        offset += len(png_data)

    # Write ICO file
    with open(output_path, "wb") as f:
        # Header: reserved(2) + type(2) + count(2)
        f.write(struct.pack("<HHH", 0, 1, len(images_dict)))
        for entry in entries:
            f.write(entry)
        for data in data_blocks:
            f.write(data)

    print(f"  Created: {output_path} (multi-size ICO)")


def create_svg_favicon(black_figure_path, white_figure_path, output_path):
    """
    Create a lightweight SVG favicon that adapts to dark/light mode.
    Uses embedded PNG images but properly sized for favicon use.
    """
    # Create small (64x64) versions for embedding
    black_fig = extract_figure(black_figure_path, is_white=False)
    white_fig = extract_figure(white_figure_path, is_white=True)

    # Create light mode version (navy bg, white figure)
    light_canvas = Image.new("RGBA", (64, 64), NAVY_BLUE + (255,))
    max_dim = int(64 * 0.70)
    fig_w, fig_h = white_fig.size
    scale = min(max_dim / fig_w, max_dim / fig_h)
    new_w = int(fig_w * scale)
    new_h = int(fig_h * scale)
    resized_white = white_fig.resize((new_w, new_h), Image.LANCZOS)
    x = (64 - new_w) // 2
    y = (64 - new_h) // 2
    light_canvas.paste(resized_white, (x, y), resized_white)

    # Create dark mode version (same - navy bg works in both themes)
    # Navy blue on dark looks great too, so use same image
    dark_canvas = light_canvas.copy()

    import base64

    # Convert to base64
    buf_light = io.BytesIO()
    light_canvas.save(buf_light, "PNG", optimize=True)
    b64_light = base64.b64encode(buf_light.getvalue()).decode()

    buf_dark = io.BytesIO()
    dark_canvas.save(buf_dark, "PNG", optimize=True)
    b64_dark = base64.b64encode(buf_dark.getvalue()).decode()

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <style>
    #light-icon {{ display: inline; }}
    #dark-icon {{ display: none; }}
    @media (prefers-color-scheme: dark) {{
      #light-icon {{ display: none; }}
      #dark-icon {{ display: inline; }}
    }}
  </style>
  <image id="light-icon" width="64" height="64" href="data:image/png;base64,{b64_light}"/>
  <image id="dark-icon" width="64" height="64" href="data:image/png;base64,{b64_dark}"/>
</svg>'''

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(svg_content)

    file_size = os.path.getsize(output_path)
    print(f"  Created: {output_path} (SVG, {file_size:,} bytes)")


def main():
    print("=== Generating favicon assets from restaurant logos ===\n")

    # Extract the atlas figure from the white logo (for use on dark bg)
    print("1. Extracting atlas figure from logos...")
    white_figure = extract_figure(LOGO_WHITE, is_white=True)
    print(f"   White figure extracted: {white_figure.size}")

    # Generate all PNG favicon sizes with navy blue background + white figure
    print("\n2. Generating PNG favicons (navy blue bg + white figure)...")

    sizes = {
        16: None,    # For ICO
        32: None,    # For ICO
        48: None,    # For ICO + Google minimum
        96: None,    # favicon-96x96.png
        180: None,   # apple-touch-icon.png
        192: None,   # web-app-manifest-192x192.png
        512: None,   # web-app-manifest-512x512.png
    }

    for size in sizes:
        canvas = Image.new("RGBA", (size, size), NAVY_BLUE + (255,))
        max_dim = int(size * 0.70)
        fig_w, fig_h = white_figure.size
        scale = min(max_dim / fig_w, max_dim / fig_h)
        new_w = int(fig_w * scale)
        new_h = int(fig_h * scale)
        resized = white_figure.resize((new_w, new_h), Image.LANCZOS)
        x = (size - new_w) // 2
        y = (size - new_h) // 2
        canvas.paste(resized, (x, y), resized)
        # Convert to RGB
        final = Image.new("RGB", (size, size), NAVY_BLUE)
        final.paste(canvas, (0, 0), canvas)
        sizes[size] = final

    # Save specific files
    sizes[96].save(os.path.join(ASSETS_DIR, "favicon-96x96.png"), "PNG", optimize=True)
    print(f"  Saved: favicon-96x96.png (96x96)")

    sizes[180].save(os.path.join(ASSETS_DIR, "apple-touch-icon.png"), "PNG", optimize=True)
    print(f"  Saved: apple-touch-icon.png (180x180)")

    sizes[192].save(os.path.join(ASSETS_DIR, "web-app-manifest-192x192.png"), "PNG", optimize=True)
    print(f"  Saved: web-app-manifest-192x192.png (192x192)")

    sizes[512].save(os.path.join(ASSETS_DIR, "web-app-manifest-512x512.png"), "PNG", optimize=True)
    print(f"  Saved: web-app-manifest-512x512.png (512x512)")

    # Generate .ico with multiple sizes (16, 32, 48)
    print("\n3. Generating favicon.ico (multi-size: 16, 32, 48)...")
    ico_images = {16: sizes[16], 32: sizes[32], 48: sizes[48]}
    create_ico(ico_images, os.path.join(ASSETS_DIR, "favicon.ico"))

    # Copy favicon.ico to root as well
    create_ico(ico_images, os.path.join(BASE_DIR, "favicon.ico"))
    print(f"  Also copied to: public/favicon.ico (root)")

    # Generate SVG favicon (lightweight, adapts to dark/light)
    print("\n4. Generating SVG favicon...")
    create_svg_favicon(LOGO_BLACK, LOGO_WHITE, os.path.join(ASSETS_DIR, "favicon.svg"))

    print("\n=== All favicon assets generated successfully! ===")


if __name__ == "__main__":
    main()
