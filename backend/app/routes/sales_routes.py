"""
Flask REST API routes for sales analytics, charts, transactions, ML forecast and CSV upload.
"""
from flask import Blueprint, request, jsonify, current_app, Response
import io
import csv
from app.services.data_service import DataService
from app.services.forecast_service import ForecastService
from app.database import DatabaseManager

sales_bp = Blueprint("sales", __name__)

def get_services():
    data_path = current_app.config["DATA_PATH"]
    default_data_path = current_app.config.get("DEFAULT_DATA_PATH")
    ds = DataService(data_path, default_data_path)
    fs = ForecastService(ds)
    return ds, fs

# -------------------------------------------------------------
# 1. Health check
# -------------------------------------------------------------
@sales_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Sales Data Analysis & Forecasting API",
        "version": "1.0.0"
    }), 200

# -------------------------------------------------------------
# 2. Executive Overview KPIs
# -------------------------------------------------------------
@sales_bp.route("/overview", methods=["GET"])
def get_overview():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    category = request.args.get("category")

    ds, _ = get_services()
    metrics = ds.get_overview_metrics(start_date, end_date, category)
    return jsonify({
        "success": True,
        "data": metrics
    }), 200

# -------------------------------------------------------------
# 3. Monthly Sales
# -------------------------------------------------------------
@sales_bp.route("/monthly-sales", methods=["GET"])
def get_monthly_sales():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    category = request.args.get("category")

    ds, _ = get_services()
    monthly = ds.get_monthly_sales(start_date, end_date, category)
    return jsonify({
        "success": True,
        "data": monthly
    }), 200

# -------------------------------------------------------------
# 4. Daily Sales Trend
# -------------------------------------------------------------
@sales_bp.route("/daily-sales", methods=["GET"])
def get_daily_sales():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    category = request.args.get("category")
    limit_days = request.args.get("limit_days", 90, type=int)

    ds, _ = get_services()
    daily = ds.get_daily_sales(start_date, end_date, category, limit_days)
    return jsonify({
        "success": True,
        "data": daily
    }), 200

# -------------------------------------------------------------
# 5. Category-wise Sales
# -------------------------------------------------------------
@sales_bp.route("/category-sales", methods=["GET"])
def get_category_sales():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    ds, _ = get_services()
    category_data = ds.get_category_sales(start_date, end_date)
    return jsonify({
        "success": True,
        "data": category_data
    }), 200

# -------------------------------------------------------------
# 6. Top Products
# -------------------------------------------------------------
@sales_bp.route("/top-products", methods=["GET"])
def get_top_products():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    category = request.args.get("category")
    limit = request.args.get("limit", 10, type=int)

    ds, _ = get_services()
    products_data = ds.get_top_products(start_date, end_date, category, limit)
    return jsonify({
        "success": True,
        "data": products_data
    }), 200

# -------------------------------------------------------------
# 7. Recent Transactions (Paginated, Searchable, Sortable)
# -------------------------------------------------------------
@sales_bp.route("/recent-sales", methods=["GET"])
def get_recent_sales():
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("page_size", 15, type=int)
    search = request.args.get("search")
    category = request.args.get("category")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    sort_by = request.args.get("sort_by", "date")
    sort_order = request.args.get("sort_order", "desc")

    ds, _ = get_services()
    result = ds.get_recent_sales(
        page=page,
        page_size=page_size,
        search=search,
        category=category,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return jsonify({
        "success": True,
        "data": result
    }), 200

# -------------------------------------------------------------
# 8. Categories List (For filter dropdowns)
# -------------------------------------------------------------
@sales_bp.route("/categories", methods=["GET"])
def get_categories():
    ds, _ = get_services()
    cats = ds.get_categories_list()
    return jsonify({
        "success": True,
        "data": cats
    }), 200

# -------------------------------------------------------------
# 9. Machine Learning Revenue Forecast
# -------------------------------------------------------------
@sales_bp.route("/forecast", methods=["GET"])
def get_forecast():
    category = request.args.get("category")
    horizon = request.args.get("horizon", 3, type=int)

    _, fs = get_services()
    forecast_data = fs.generate_forecast(category=category, forecast_horizon_months=horizon)
    
    if not forecast_data.get("success"):
        return jsonify({
            "success": False,
            "error": forecast_data.get("error")
        }), 400

    return jsonify({
        "success": True,
        "data": forecast_data
    }), 200

# -------------------------------------------------------------
# 10. CSV Upload
# -------------------------------------------------------------
@sales_bp.route("/upload", methods=["POST"])
def upload_csv():
    if "file" not in request.files:
        return jsonify({
            "success": False,
            "error": "No file uploaded. Expected 'file' multipart field."
        }), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({
            "success": False,
            "error": "Empty filename."
        }), 400

    if not file.filename.lower().endswith(".csv"):
        return jsonify({
            "success": False,
            "error": "Invalid file type. Only CSV (.csv) files are supported."
        }), 400

    ds, _ = get_services()
    result = ds.process_and_save_upload(file)

    if not result.get("success"):
        return jsonify({
            "success": False,
            "error": result.get("error")
        }), 400

    return jsonify({
        "success": True,
        "message": f"Successfully imported {result['imported_rows']} records.",
        "data": result
    }), 200

# -------------------------------------------------------------
# 11. Reset to Default Realistic Sample Dataset
# -------------------------------------------------------------
@sales_bp.route("/reset", methods=["POST"])
def reset_dataset():
    ds, _ = get_services()
    result = ds.reset_to_default()
    if not result.get("success"):
        return jsonify({
            "success": False,
            "error": result.get("error")
        }), 400

    return jsonify({
        "success": True,
        "message": result.get("message")
    }), 200

# -------------------------------------------------------------
# 12. Export Filtered Data as CSV
# -------------------------------------------------------------
@sales_bp.route("/export", methods=["GET"])
def export_csv():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    category = request.args.get("category")
    search = request.args.get("search")

    ds, _ = get_services()
    df = ds.filter_data(start_date, end_date, category, search)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["date", "product", "category", "quantity", "price", "revenue"])
    for _, r in df.iterrows():
        writer.writerow([
            r["date"].strftime("%Y-%m-%d"),
            r["product"],
            r["category"],
            r["quantity"],
            r["price"],
            r["revenue"]
        ])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=sales_export.csv"}
    )

# -------------------------------------------------------------
# 13. Database Status (MySQL / SQLite)
# -------------------------------------------------------------
@sales_bp.route("/database/status", methods=["GET"])
def get_database_status():
    data_path = current_app.config["DATA_PATH"]
    db = DatabaseManager.get_instance(data_path)
    status = db.get_status()
    return jsonify({
        "success": True,
        "data": status
    }), 200

# -------------------------------------------------------------
# 14. Configure & Connect MySQL Database
# -------------------------------------------------------------
@sales_bp.route("/database/config", methods=["POST"])
def configure_database():
    data = request.get_json() or {}
    host = data.get("host", "localhost")
    port = data.get("port", 3306)
    user = data.get("user", "root")
    password = data.get("password", "")
    database = data.get("database", "sales_analytics_db")

    data_path = current_app.config["DATA_PATH"]
    db = DatabaseManager.get_instance(data_path)
    result = db.switch_to_mysql(host, port, user, password, database)

    if not result.get("success"):
        return jsonify({
            "success": False,
            "error": result.get("error")
        }), 400

    # Also sync current data into the newly connected MySQL database
    ds, _ = get_services()
    df = ds.get_df(force_reload=True)
    if not df.empty:
        db.seed_from_dataframe(df)

    return jsonify({
        "success": True,
        "message": result.get("message"),
        "data": db.get_status()
    }), 200

