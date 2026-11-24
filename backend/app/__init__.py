"""
Sales Analytics Backend Application Factory
"""
from flask import Flask
from flask_cors import CORS
import os

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    
    # Configure CORS for Vite frontend running on default ports (5173, 3000, etc.)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    
    # Base configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev-secret-sales-analytics-2026"),
        DATA_PATH=os.environ.get("DATA_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "sales.csv")),
        DEFAULT_DATA_PATH=os.path.join(os.path.dirname(__file__), "..", "data", "default_sales.csv"),
        MAX_CONTENT_LENGTH=16 * 1024 * 1024  # Max 16MB file upload
    )

    if test_config:
        app.config.from_mapping(test_config)

    # Register blueprints
    from app.routes.sales_routes import sales_bp
    app.register_blueprint(sales_bp, url_prefix="/api")

    return app
