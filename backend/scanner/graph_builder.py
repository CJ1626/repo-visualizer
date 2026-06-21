import os
import pathlib

from scanner.walker import walk_directory
from scanner.parser import extract_imports


def _resolve_python_import(module_name: str, lookup: dict, importing_rel: str) -> str | None:
    """
    Attempt to resolve a Python module name (e.g. 'scanner.walker') to a
    rel_path key present in the lookup dict.
    Also handles relative imports (leading dots stripped for simplicity).
    """
    # Strip leading dots from relative imports
    clean = module_name.lstrip(".")

    # Try direct dot-to-slash conversion, with and without __init__
    candidates = [
        clean.replace(".", "/") + ".py",
        clean.replace(".", "/") + "/__init__.py",
    ]
    for candidate in candidates:
        if candidate in lookup:
            return candidate

    # Sometimes the module is just the final component (e.g. bare 'os' won't
    # be in the tree, but project-local names might be under a subdirectory)
    # Try matching by filename stem as a last resort
    stem = clean.split(".")[-1]
    for rel in lookup:
        if pathlib.Path(rel).stem == stem and rel.endswith(".py"):
            return rel

    return None


def _resolve_js_import(specifier: str, importing_rel: str, lookup: dict) -> str | None:
    """
    Attempt to resolve a JS/TS import specifier relative to the importing file.
    Only resolves relative specifiers (starting with ./ or ../).
    """
    if not specifier.startswith("."):
        return None  # External package — skip

    importing_dir = str(pathlib.Path(importing_rel).parent)
    # Normalise: join importing_dir + specifier, then normalise path separators
    raw = os.path.normpath(os.path.join(importing_dir, specifier))
    # os.path.normpath uses OS separator; ensure forward slashes
    raw = raw.replace(os.sep, "/")

    # If specifier already has an extension and is directly in lookup
    if raw in lookup:
        return raw

    # Try common JS/TS extensions
    for ext in (".js", ".jsx", ".ts", ".tsx", ".mjs"):
        candidate = raw + ext
        if candidate in lookup:
            return candidate

    # Try index files
    for ext in (".js", ".jsx", ".ts", ".tsx"):
        candidate = raw + "/index" + ext
        if candidate in lookup:
            return candidate

    return None


def build_graph(root_path: str) -> dict:
    """
    Build a node-edge graph for all source files under root_path.

    Returns:
        {
            "nodes": [{"id", "label", "loc", "path", "rel_path", "extension"}, ...],
            "edges": [{"id", "source", "target"}, ...]
        }
    """
    files = walk_directory(root_path)

    # Build lookup: rel_path -> True (used for membership checks)
    lookup: dict[str, bool] = {f["rel_path"]: True for f in files}

    # Build nodes
    nodes = []
    for f in files:
        nodes.append({
            "id": f["rel_path"],
            "label": pathlib.Path(f["rel_path"]).name,
            "loc": f["loc"],
            "path": f["path"],
            "rel_path": f["rel_path"],
            "extension": f["extension"],
        })

    # Build edges
    edges = []
    seen_edges: set[str] = set()

    for f in files:
        source_id = f["rel_path"]
        ext = f["extension"].lower()
        imports = extract_imports(f["path"])

        for specifier in imports:
            target_id: str | None = None

            if ext == ".py":
                target_id = _resolve_python_import(specifier, lookup, source_id)
            elif ext in {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"}:
                target_id = _resolve_js_import(specifier, source_id, lookup)
            # C/C++ header resolution not attempted (headers may live in system dirs)

            if target_id and target_id != source_id:
                edge_id = f"{source_id}->{target_id}"
                if edge_id not in seen_edges:
                    seen_edges.add(edge_id)
                    edges.append({
                        "id": edge_id,
                        "source": source_id,
                        "target": target_id,
                    })

    return {"nodes": nodes, "edges": edges}
