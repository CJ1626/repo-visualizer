import os
import pathlib

SKIP_DIRS = {"node_modules", ".git", "venv", "dist", "__pycache__", ".next", "build"}


def count_lines(filepath: str) -> int:
    """Count non-empty lines in a file. Returns 0 on any error."""
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return sum(1 for line in f if line.strip())
    except Exception:
        return 0


def walk_directory(root_path: str) -> list[dict]:
    """
    Recursively walk root_path, skipping SKIP_DIRS.
    Returns a list of dicts with path, rel_path, extension, and loc.
    """
    root = pathlib.Path(root_path).resolve()
    results = []

    for dirpath, dirnames, filenames in os.walk(root):
        # Prune skipped directories in-place so os.walk won't descend into them
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        for filename in filenames:
            abs_path = pathlib.Path(dirpath) / filename
            try:
                rel_path = str(abs_path.relative_to(root))
            except ValueError:
                rel_path = str(abs_path)

            extension = abs_path.suffix  # e.g. ".py", ".js"
            loc = count_lines(str(abs_path))

            results.append({
                "path": str(abs_path),
                "rel_path": rel_path,
                "extension": extension,
                "loc": loc,
            })

    return results


if __name__ == "__main__":
    import sys

    target = sys.argv[1] if len(sys.argv) > 1 else "."
    files = walk_directory(target)
    for entry in files[:10]:
        print(entry)
    print(f"\nTotal files found: {len(files)}")
