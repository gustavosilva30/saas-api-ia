import os
import io
import json
import uuid
import subprocess
import shutil
from PIL import Image, ImageDraw
import tempfile

class MotionRenderer:
    def __init__(self, fps=30):
        self.fps = fps

    def _interpolate(self, start_val, end_val, progress):
        return start_val + (end_val - start_val) * progress

    def render_timeline(self, timeline_data: dict, output_path: str, output_format="mp4"):
        """
        timeline_data: {
            "duration": 5.0, # seconds
            "width": 1080,
            "height": 1080,
            "background": "#ffffff",
            "layers": [
                {
                    "type": "image",
                    "url": "local_path_or_url", # For simplicity, local absolute path
                    "keyframes": [
                        {"time": 0.0, "x": 0, "y": 0, "opacity": 1.0, "scale": 1.0},
                        {"time": 5.0, "x": 500, "y": 0, "opacity": 1.0, "scale": 1.5}
                    ]
                }
            ]
        }
        """
        duration = min(timeline_data.get("duration", 5.0), 15.0) # max 15s limit
        width = min(timeline_data.get("width", 1080), 1080)
        height = min(timeline_data.get("height", 1080), 1080)
        bg_color = timeline_data.get("background", "#ffffff")
        
        total_frames = int(duration * self.fps)
        layers = timeline_data.get("layers", [])

        # Load layer images
        layer_images = []
        for layer in layers:
            if layer.get("type") == "image":
                try:
                    img = Image.open(layer["url"]).convert("RGBA")
                    layer_images.append(img)
                except Exception as e:
                    print(f"Erro ao carregar {layer['url']}: {e}")
                    layer_images.append(None)
            else:
                layer_images.append(None)

        # Temp directory for frames
        temp_dir = tempfile.mkdtemp(prefix="motion_render_")
        
        try:
            for frame_idx in range(total_frames):
                current_time = frame_idx / self.fps
                
                # Canvas base
                canvas = Image.new("RGBA", (width, height), bg_color)
                
                for idx, layer in enumerate(layers):
                    if not layer_images[idx]:
                        continue
                        
                    keyframes = sorted(layer.get("keyframes", []), key=lambda k: k["time"])
                    if not keyframes:
                        continue
                        
                    # Find active keyframes for interpolation
                    kf_start = keyframes[0]
                    kf_end = keyframes[-1]
                    
                    for i in range(len(keyframes) - 1):
                        if keyframes[i]["time"] <= current_time <= keyframes[i+1]["time"]:
                            kf_start = keyframes[i]
                            kf_end = keyframes[i+1]
                            break
                    else:
                        if current_time < keyframes[0]["time"]:
                            kf_end = keyframes[0]
                        elif current_time > keyframes[-1]["time"]:
                            kf_start = keyframes[-1]
                    
                    # Interpolation progress
                    t_diff = kf_end["time"] - kf_start["time"]
                    if t_diff > 0:
                        progress = max(0.0, min(1.0, (current_time - kf_start["time"]) / t_diff))
                    else:
                        progress = 0.0

                    x = self._interpolate(kf_start.get("x", 0), kf_end.get("x", 0), progress)
                    y = self._interpolate(kf_start.get("y", 0), kf_end.get("y", 0), progress)
                    scale = self._interpolate(kf_start.get("scale", 1.0), kf_end.get("scale", 1.0), progress)
                    opacity = self._interpolate(kf_start.get("opacity", 1.0), kf_end.get("opacity", 1.0), progress)
                    
                    # Apply transformations
                    layer_img = layer_images[idx].copy()
                    if scale != 1.0:
                        new_w = int(layer_img.width * scale)
                        new_h = int(layer_img.height * scale)
                        if new_w > 0 and new_h > 0:
                            layer_img = layer_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                            
                    if opacity < 1.0:
                        alpha = layer_img.split()[3]
                        alpha = alpha.point(lambda p: p * opacity)
                        layer_img.putalpha(alpha)
                        
                    # Paste layer onto canvas
                    canvas.paste(layer_img, (int(x), int(y)), mask=layer_img)
                
                # Save frame
                frame_path = os.path.join(temp_dir, f"frame_{frame_idx:04d}.png")
                # Convert RGBA to RGB for mp4/ffmpeg compatibility if no transparency needed for the final video
                canvas = canvas.convert("RGB")
                canvas.save(frame_path, format="PNG")
                
            # Stitch with FFmpeg
            frame_pattern = os.path.join(temp_dir, "frame_%04d.png")
            
            if output_format == "mp4":
                # ffmpeg -framerate 30 -i frame_%04d.png -c:v libx264 -pix_fmt yuv420p output.mp4
                cmd = [
                    "ffmpeg", "-y", "-framerate", str(self.fps),
                    "-i", frame_pattern,
                    "-c:v", "libx264", "-pix_fmt", "yuv420p",
                    "-preset", "fast",
                    output_path
                ]
            elif output_format == "gif":
                # ffmpeg -framerate 30 -i frame_%04d.png -vf "split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" output.gif
                cmd = [
                    "ffmpeg", "-y", "-framerate", str(self.fps),
                    "-i", frame_pattern,
                    "-vf", "split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
                    output_path
                ]
            else:
                raise ValueError("Format not supported")

            # Run ffmpeg
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
        finally:
            # Cleanup frames
            shutil.rmtree(temp_dir, ignore_errors=True)
            
        return output_path
