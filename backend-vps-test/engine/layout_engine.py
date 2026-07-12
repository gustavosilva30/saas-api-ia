import json
import os
import textwrap
from PIL import Image, ImageDraw, ImageFont

class CampaignBuilder:
    def __init__(self, templates_dir="templates"):
        self.templates_dir = templates_dir
        
    def load_template(self, template_id: str) -> dict:
        path = os.path.join(self.templates_dir, f"{template_id}.json")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Template {template_id} não encontrado.")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _get_nested(self, dictionary: dict, keys_str: str, default=None):
        keys = keys_str.split('.')
        val = dictionary
        try:
            for k in keys:
                val = val[k]
            return val if val is not None else default
        except (KeyError, TypeError):
            return default

    def render(self, product_image: Image.Image, template_id: str, copy_data: dict, brand_kit: dict = None) -> Image.Image:
        brand_kit = brand_kit or {}
        tpl = self.load_template(template_id)
        
        width = tpl.get("width", 1080)
        height = tpl.get("height", 1080)
        
        canvas = Image.new("RGBA", (width, height), (255, 255, 255, 255))
        draw = ImageDraw.Draw(canvas)
        
        for el in tpl.get("elements", []):
            el_type = el.get("type")
            
            # Resolve binds for colors
            color = el.get("color", "#000000")
            if "bind_color" in el:
                bound_color = self._get_nested({"brand_kit": brand_kit}, el["bind_color"])
                if bound_color:
                    color = bound_color
                    
            if el_type == "background":
                if "bind" in el:
                    bound_bg = self._get_nested({"brand_kit": brand_kit}, el["bind"])
                    if bound_bg: color = bound_bg
                draw.rectangle([0, 0, width, height], fill=color)
                
            elif el_type == "rect":
                x, y = el.get("x", 0), el.get("y", 0)
                w, h = el.get("width", 100), el.get("height", 100)
                align = el.get("align", "left")
                valign = el.get("valign", "top")
                
                if align == "center":
                    x = x - w / 2
                elif align == "right":
                    x = x - w
                    
                if valign == "center":
                    y = y - h / 2
                elif valign == "bottom":
                    y = y - h
                    
                # Pillow >= 8.2 supports rounded_rectangle
                radius = el.get("border_radius", 0)
                if radius > 0 and hasattr(draw, "rounded_rectangle"):
                    draw.rounded_rectangle([x, y, x + w, y + h], radius, fill=color)
                else:
                    draw.rectangle([x, y, x + w, y + h], fill=color)
                    
            elif el_type == "image":
                if el.get("name") == "product":
                    # Resize product to fit max_width / max_height
                    max_w = el.get("max_width", width)
                    max_h = el.get("max_height", height)
                    
                    product_image.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
                    pw, ph = product_image.size
                    
                    x, y = el.get("x", 0), el.get("y", 0)
                    align = el.get("align", "left")
                    valign = el.get("valign", "top")
                    
                    if align == "center": x = x - pw / 2
                    elif align == "right": x = x - pw
                    
                    if valign == "center": y = y - ph / 2
                    elif valign == "bottom": y = y - ph
                    
                    canvas.paste(product_image, (int(x), int(y)), mask=product_image if product_image.mode == 'RGBA' else None)
                    
            elif el_type == "text":
                text = "Texto"
                if "bind" in el:
                    bound_text = self._get_nested({"copy": copy_data}, el["bind"])
                    if bound_text: text = str(bound_text)
                
                font_size = el.get("font_size", 24)
                try:
                    # Tenta carregar arial se disponível no Windows, ou tenta fallback padrão
                    # O ideal no futuro é ter arquivos TTF locais na pasta fonts/
                    font = ImageFont.truetype("arial.ttf", font_size)
                except IOError:
                    try:
                        font = ImageFont.truetype("DejaVuSans.ttf", font_size)
                    except IOError:
                        font = ImageFont.load_default()

                max_w = el.get("max_width", width)
                
                # Simple word wrap
                # Estimate chars per line based on font size and max width
                # This is a very rough estimate if we don't measure exactly
                # But we can measure using getbbox
                
                words = text.split(' ')
                lines = []
                current_line = []
                
                for word in words:
                    current_line.append(word)
                    test_line = ' '.join(current_line)
                    if hasattr(font, 'getlength'):
                        w = font.getlength(test_line)
                    else:
                        bbox = draw.textbbox((0,0), test_line, font=font)
                        w = bbox[2] - bbox[0]
                        
                    if w > max_w and len(current_line) > 1:
                        current_line.pop()
                        lines.append(' '.join(current_line))
                        current_line = [word]
                        
                if current_line:
                    lines.append(' '.join(current_line))
                    
                align = el.get("align", "left")
                valign = el.get("valign", "top")
                
                # Calculate total text block height
                line_height = font_size * 1.2
                total_h = len(lines) * line_height
                
                x, y = el.get("x", 0), el.get("y", 0)
                if valign == "center": y = y - total_h / 2
                elif valign == "bottom": y = y - total_h
                
                current_y = y
                for line in lines:
                    if hasattr(font, 'getlength'):
                        lw = font.getlength(line)
                    else:
                        bbox = draw.textbbox((0,0), line, font=font)
                        lw = bbox[2] - bbox[0]
                        
                    line_x = x
                    if align == "center": line_x = x - lw / 2
                    elif align == "right": line_x = x - lw
                    
                    draw.text((line_x, current_y), line, fill=color, font=font)
                    current_y += line_height
                    
        return canvas
