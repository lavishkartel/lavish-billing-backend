import numpy as np
import librosa
import soundfile as sf
import os
from media_matrix_visualizer import MediaMatrixVisualizer

# Create synthetic audio for testing
print("[🎛️] GENERATING: Synthetic test audio...")
sr = 22050
duration = 2  # 2 seconds for faster testing
t = np.linspace(0, duration, int(sr * duration), False)

# Mix frequencies: bass (50Hz) + mids (1000Hz) + strings (3000Hz)
bass = 0.5 * np.sin(2 * np.pi * 50 * t)
mids = 0.3 * np.sin(2 * np.pi * 1000 * t)
strings = 0.2 * np.sin(2 * np.pi * 3000 * t)
y = bass + mids + strings

# Ensure audio directory exists
os.makedirs("audio", exist_ok=True)

# Save test audio
test_audio_path = "./audio/orchestral_hiphop_ep_master.wav"
sf.write(test_audio_path, y, sr)
print(f"[✓] Test audio saved to {test_audio_path}")

# Run visualizer
print("\n[🎵] RUNNING: MediaMatrixVisualizer...")
visualizer = MediaMatrixVisualizer(test_audio_path, fps=30)
visualizer.compile_render_matrix("./visualizer/chicago_skyline_keyframes.json")

# Verify output
output_file = "./visualizer/chicago_skyline_keyframes.json"
if os.path.exists(output_file):
    file_size = os.path.getsize(output_file)
    print(f"[✓] Output verified: {file_size} bytes")
    with open(output_file, "r") as f:
        import json
        data = json.load(f)
        print(f"[✓] Keyframes generated: {data['meta']['total_frames']} frames")
        print(f"[✓] First frame sample: {json.dumps(data['keyframes'][0], indent=2)}")
else:
    print("[✗] Output file not created!")
