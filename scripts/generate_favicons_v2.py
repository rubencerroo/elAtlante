import os
from PIL import Image

# Paths
BASE_DIR = r"c:\Users\ruben\Desktop\Cosas\elAtlante\public"
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
LOGO_BLACK = os.path.join(BASE_DIR, "logoblack.png")

# Colors
WHITE = (255, 255, 255, 255)

def create_favicon(img, size, output_path):
    """
    Creates a square favicon of the given size, fitting the original logo 
    inside with a white background.
    """
    # Create a white square canvas
    canvas = Image.new("RGBA", (size, size), WHITE)
    
    # Calculate scale to fit the logo within the canvas while maintaining aspect ratio
    # Leaving a small 10% padding
    pad = int(size * 0.1)
    available_size = size - (pad * 2)
    
    img_w, img_h = img.size
    scale = min(available_size / img_w, available_size / img_h)
    new_w = int(img_w * scale)
    new_h = int(img_h * scale)
    
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Center the logo on the canvas
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    
    # Paste the resized logo onto the white canvas using its alpha channel as a mask
    canvas.paste(resized, (x, y), resized)
    
    # Convert to RGB (removing alpha) as favicons generally should be solid, 
    # and we definitely want a solid white background as requested.
    final = canvas.convert("RGB")
    final.save(output_path, "PNG", optimize=True)
    print(f"Created: {output_path} ({size}x{size})")
    return final

def main():
    print("=== Generating favicons directly from logoblack.png ===")
    
    if not os.path.exists(LOGO_BLACK):
        print(f"Error: Could not find {LOGO_BLACK}")
        return
        
    img = Image.open(LOGO_BLACK).convert("RGBA")
    
    # Sizes needed
    sizes = {
        16: None,
        32: None,
        48: None,
        96: "favicon-96x96.png",
        180: "apple-touch-icon.png",
        192: "web-app-manifest-192x192.png",
        512: "web-app-manifest-512x512.png"
    }
    
    generated_images = {}
    
    for size, filename in sizes.items():
        # Generate the image in memory
        output_path = os.path.join(ASSETS_DIR, filename) if filename else None
        
        # We need to save the specific requested PNG files
        if filename:
            final_img = create_favicon(img, size, output_path)
            generated_images[size] = final_img
        else:
            # Just generate in memory for the .ico file
            canvas = Image.new("RGBA", (size, size), WHITE)
            pad = int(size * 0.1)
            available_size = size - (pad * 2)
            img_w, img_h = img.size
            scale = min(available_size / img_w, available_size / img_h)
            new_w = int(img_w * scale)
            new_h = int(img_h * scale)
            resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            x = (size - new_w) // 2
            y = (size - new_h) // 2
            canvas.paste(resized, (x, y), resized)
            final_img = canvas.convert("RGB")
            generated_images[size] = final_img
            
    # Create the .ico file with 16, 32, 48, 96 sizes
    ico_sizes = [16, 32, 48, 96]
    ico_images = [generated_images[s] for s in ico_sizes]
    
    ico_assets_path = os.path.join(ASSETS_DIR, "favicon.ico")
    ico_root_path = os.path.join(BASE_DIR, "favicon.ico")
    
    ico_images[0].save(ico_assets_path, format="ICO", sizes=[(s, s) for s in ico_sizes], append_images=ico_images[1:])
    print(f"Created: {ico_assets_path} (ICO containing {ico_sizes})")
    
    ico_images[0].save(ico_root_path, format="ICO", sizes=[(s, s) for s in ico_sizes], append_images=ico_images[1:])
    print(f"Created: {ico_root_path} (ICO containing {ico_sizes})")
    
    # Replace the favicon.svg with a copy of logoblack.png for simplicity, 
    # but actual vector graphic is better. Since we must use the logo, we'll
    # just create a simple SVG that embeds the logo, or we can just rely on the PNGs.
    # index.html currently references favicon.svg. 
    # I'll create a basic SVG that wraps the PNG so we don't break the HTML link.
    svg_path = os.path.join(ASSETS_DIR, "favicon.svg")
    import base64
    from io import BytesIO
    buf = BytesIO()
    # Use the 512 size for high quality in the SVG
    generated_images[512].save(buf, format="PNG")
    b64_data = base64.b64encode(buf.getvalue()).decode('utf-8')
    
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <image width="512" height="512" href="data:image/png;base64,{b64_data}"/>
</svg>'''
    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print(f"Created SVG wrapper: {svg_path}")

    print("\n=== Generation complete! ===")

if __name__ == "__main__":
    main()
