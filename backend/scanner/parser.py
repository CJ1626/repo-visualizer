import ast
import re
import pathlib


def extract_imports_python(filepath: str) -> list[str]:
    """
    Use ast.parse to extract all imported module names from a Python file.
    Handles both 'import X' and 'from X import Y' forms.
    Returns [] on any parse error.
    """
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            source = f.read()
        tree = ast.parse(source, filename=filepath)
    except Exception:
        return []

    modules = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                modules.append(alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                # Reconstruct absolute module name using level (relative imports)
                prefix = "." * (node.level or 0)
                modules.append(prefix + node.module)
    return modules


def extract_imports_js(filepath: str) -> list[str]:
    """
    Use regex to extract import specifiers from JS/TS files.
    Handles:
      import ... from '...' / "..."
      require('...') / require("...")
    Returns list of specifier strings.
    """
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            source = f.read()
    except Exception:
        return []

    specifiers = []

    # ES module imports: import ... from 'specifier'
    es_import_re = re.compile(
        r"""import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]""",
        re.MULTILINE,
    )
    specifiers.extend(m.group(1) for m in es_import_re.finditer(source))

    # CommonJS require: require('specifier')
    cjs_require_re = re.compile(r"""require\(\s*['"]([^'"]+)['"]\s*\)""")
    specifiers.extend(m.group(1) for m in cjs_require_re.finditer(source))

    return specifiers


def extract_imports_c(filepath: str) -> list[str]:
    """
    Use regex to extract header names from C/C++ files.
    Handles both #include "..." and #include <...>.
    Returns list of header name strings.
    """
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            source = f.read()
    except Exception:
        return []

    include_re = re.compile(r'#include\s+[<"]([^>"]+)[>"]')
    return [m.group(1) for m in include_re.finditer(source)]


def extract_imports(filepath: str) -> list[str]:
    """
    Dispatcher: choose the right extractor based on file extension.
    Returns [] for unrecognised extensions.
    """
    ext = pathlib.Path(filepath).suffix.lower()
    if ext == ".py":
        return extract_imports_python(filepath)
    elif ext in {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"}:
        return extract_imports_js(filepath)
    elif ext in {".c", ".cpp", ".cc", ".cxx", ".h", ".hpp"}:
        return extract_imports_c(filepath)
    return []
