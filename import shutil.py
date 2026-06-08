import shutil
from pathlib import Path

# ==========================================
# CONFIGURATION 
# ==========================================
# Set these to your specific Dell workstation paths
SOURCE_DIR = Path("./raw_exports")
DEST_DIR = Path("./engine_ready_assets")
PROJECT_PREFIX = "KARTEL_PH2"

# File type routing logic
FILE_CATEGORIES = {
    "Meshes": ['.fbx', '.obj', '.gltf', '.glb', '.blend'],
    "Textures": ['.png', '.jpg', '.jpeg', '.tga', '.exr', '.tiff'],
    "Physics_Configs": ['.json', '.xml', '.zprj']
}

# ==========================================
# OPERATIONAL FUNCTIONS
# ==========================================

def setup_directories():
    """Ensures the destination master directory exists."""
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[*] Pipeline initialized. Output routed to: {DEST_DIR}")

def get_category(extension):
    """Matches a file extension to its correct folder category."""
    for category, exts in FILE_CATEGORIES.items():
        if extension.lower() in exts:
            return category
    return "Misc"

def validate_asset_completeness(asset_folder_path):
    """
    Checks if an asset has the minimum required files (at least one mesh).
    Expands easily to check for textures or specific config files.
    """
    meshes = list(asset_folder_path.glob("Meshes/*"))
    if not meshes:
        print(f"[!] VALIDATION FAILED: {asset_folder_path.name} is missing mesh data.")
        return False
    return True

def process_assets():
    """Main execution loop for renaming and routing files."""
    if not SOURCE_DIR.exists():
        print(f"[!] Source directory {SOURCE_DIR} not found. Halting.")
        return

    # Look at every item in the source directory
    for item in SOURCE_DIR.iterdir():
        if item.is_file():
            # 1. Identify the asset name (assumes raw files are named like "Hoodie_v2.fbx")
            raw_name = item.stem
            extension = item.suffix
            
            # 2. Standardize the naming convention
            clean_name = raw_name.replace(" ", "_").replace("-", "_")
            standardized_filename = f"{PROJECT_PREFIX}_{clean_name}{extension}"
            
            # 3. Determine asset grouping (groups by the clean name)
            asset_dir = DEST_DIR / clean_name
            
            # 4. Determine sub-folder based on file type
            category = get_category(extension)
            target_sub_dir = asset_dir / category
            target_sub_dir.mkdir(parents=True, exist_ok=True)
            
            # 5. Move and rename the file
            target_file_path = target_sub_dir / standardized_filename
            shutil.copy2(item, target_file_path) # Using copy2 to preserve metadata. Change to .move if preferred.
            
            print(f"[+] Processed: {standardized_filename} -> {category}/")

    print("\n[*] Batch Processing Complete. Initiating Structure Validation...\n")

    # 6. Post-Processing Validation
    for asset_dir in DEST_DIR.iterdir():
        if asset_dir.is_dir():
            if validate_asset_completeness(asset_dir):
                print(f"[OK] {asset_dir.name} is engine-ready.")

# ==========================================
# EXECUTION
# ==========================================
if __name__ == "__main__":
    print("=== ASSET PIPELINE AUTOMATION STARTING ===")
    setup_directories()
    process_assets()
    print("=== ASSET PIPELINE AUTOMATION COMPLETE ===")