import numpy as np
import librosa
import json
import os

class MediaMatrixVisualizer:
    def __init__(self, audio_path, fps=30):
        self.audio_path = audio_path
        self.fps = fps
        self.y, self.sr = librosa.load(audio_path, sr=None)
        self.hop_length = max(1, int(self.sr / fps))
        self.stft = np.abs(librosa.stft(self.y, hop_length=self.hop_length))
        self.frequencies = librosa.fft_frequencies(sr=self.sr)

    def extract_band_energy(self, low_freq, high_freq):
        """Extracts normalized energy within a specific frequency band per frame."""
        idx = np.where((self.frequencies >= low_freq) & (self.frequencies <= high_freq))[0]
        if len(idx) == 0:
            return np.zeros(self.stft.shape[1]).tolist()

        band_stft = self.stft[idx, :]
        energy = np.sum(band_stft, axis=0)

        if np.max(energy) > 0:
            energy = (energy - np.min(energy)) / (np.max(energy) - np.min(energy))

        return np.round(energy, 4).tolist()

    def compile_render_matrix(self, output_path):
        """Maps frequency bands to environmental render parameters."""
        print(f"[🎵] ANALYZING: {os.path.basename(self.audio_path)}")

        sub_bass_energy = self.extract_band_energy(20, 60)
        string_energy = self.extract_band_energy(2000, 5000)
        total_frames = len(sub_bass_energy)

        render_keyframes = []
        for frame in range(total_frames):
            glitch_trigger = 1 if sub_bass_energy[frame] > 0.85 else 0
            frame_data = {
                "frame": frame,
                "timestamp_sec": round(frame / self.fps, 3),
                "environment_modifiers": {
                    "willis_tower_pulse": sub_bass_energy[frame],
                    "holographic_l_tracks_speed": round(1.0 + (sub_bass_energy[frame] * 2.0), 2),
                    "skyline_glitch_active": glitch_trigger,
                    "ambient_neon_brightness": string_energy[frame],
                    "volumetric_mist_density": round(0.2 + (string_energy[frame] * 0.6), 2),
                    "hue_shift_deg": int(string_energy[frame] * 45)
                }
            }
            render_keyframes.append(frame_data)

        payload = {
            "meta": {
                "track_name": os.path.basename(self.audio_path),
                "fps": self.fps,
                "total_frames": total_frames
            },
            "keyframes": render_keyframes
        }

        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=4)

        print(f"[🌐] SUCCESS: Media matrix compiled. {total_frames} frames mapped to '{output_path}'")


if __name__ == "__main__":
    AUDIO_INPUT = "./audio/orchestral_hiphop_ep_master.wav"
    RENDER_OUTPUT = "./visualizer/chicago_skyline_keyframes.json"

    visualizer = MediaMatrixVisualizer(AUDIO_INPUT, fps=30)
    visualizer.compile_render_matrix(RENDER_OUTPUT)
