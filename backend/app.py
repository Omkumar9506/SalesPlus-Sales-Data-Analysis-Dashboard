"""
Entry point for running the Flask backend development server.
"""
import os
import sys

# Ensure backend directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "127.0.0.1")
    debug = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    print(f"Starting Sales Analytics Backend Server on http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)

