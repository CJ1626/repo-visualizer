import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/scan")
def scan():
    data = request.get_json(silent=True) or {}
    path = data.get("path", "").strip()

    if not path:
        return jsonify({"error": "Missing 'path' in request body."}), 400

    if not os.path.isdir(path):
        return jsonify({"error": f"Path does not exist or is not a directory: {path}"}), 400

    try:
        from scanner.graph_builder import build_graph
        graph = build_graph(path)
        return jsonify(graph)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/summarize")
def summarize_file():
    data = request.get_json(silent=True) or {}
    path = data.get("path", "").strip()

    if not path:
        return jsonify({"error": "Missing 'path' in request body."}), 400

    if not os.path.isfile(path):
        return jsonify({"error": f"File does not exist: {path}"}), 400

    try:
        from ai.summarizer import summarize
        result = summarize(path)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)
