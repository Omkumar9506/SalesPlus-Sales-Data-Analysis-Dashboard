"""
Unit and integration tests for backend services and REST endpoints.
"""
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
import json

def test_backend():
    print("=== Testing Sales Analytics Backend ===")
    app = create_app()
    client = app.test_client()

    # 1. Health check
    resp = client.get("/api/health")
    assert resp.status_code == 200, f"Health check failed: {resp.status_code}"
    print("✓ Health check endpoint passed:", resp.get_json())

    # 2. Overview metrics
    resp = client.get("/api/overview")
    assert resp.status_code == 200
    ov_data = resp.get_json()["data"]
    print(f"✓ Overview passed: Total Revenue=${ov_data['total_revenue']:,}, Orders={ov_data['total_orders']:,}, AOV=${ov_data['average_order_value']}")
    print(f"  Comparison: {ov_data['comparison']['revenue_growth']}% growth, {ov_data['comparison']['comparison_label']}")
    assert ov_data["total_revenue"] > 0
    assert ov_data["total_orders"] > 1000

    # 3. Monthly sales
    resp = client.get("/api/monthly-sales")
    assert resp.status_code == 200
    m_data = resp.get_json()["data"]
    print(f"✓ Monthly sales passed: {len(m_data)} months aggregated (e.g. {m_data[0]['month_name']} to {m_data[-1]['month_name']})")
    assert len(m_data) >= 12

    # 4. Daily sales
    resp = client.get("/api/daily-sales?limit_days=30")
    assert resp.status_code == 200
    d_data = resp.get_json()["data"]
    print(f"✓ Daily sales passed: {len(d_data)} daily data points retrieved")
    assert len(d_data) > 0

    # 5. Category sales
    resp = client.get("/api/category-sales")
    assert resp.status_code == 200
    c_data = resp.get_json()["data"]
    print(f"✓ Category sales passed: {len(c_data)} categories found:")
    for cat in c_data:
        print(f"   - {cat['category']}: ${cat['revenue']:,} ({cat['percentage']}%)")
    assert len(c_data) >= 4

    # 6. Top products
    resp = client.get("/api/top-products?limit=5")
    assert resp.status_code == 200
    p_data = resp.get_json()["data"]
    print(f"✓ Top products passed: Top by revenue: '{p_data['by_revenue'][0]['product']}' (${p_data['by_revenue'][0]['revenue']:,})")
    assert len(p_data["by_revenue"]) == 5

    # 7. Recent sales
    resp = client.get("/api/recent-sales?page=1&page_size=10&sort_by=revenue&sort_order=desc")
    assert resp.status_code == 200
    r_data = resp.get_json()["data"]
    print(f"✓ Recent transactions passed: {r_data['total_records']} total transactions, 10 returned on page 1")
    assert len(r_data["records"]) == 10

    # 8. ML Revenue Forecast
    resp = client.get("/api/forecast?horizon=3")
    assert resp.status_code == 200
    f_data = resp.get_json()["data"]
    print("✓ ML Revenue Forecast passed:")
    print(f"  Model: {f_data['model_type']}")
    print(f"  Evaluation: MAE=${f_data['metrics']['mae']:,}, RMSE=${f_data['metrics']['rmse']:,}, R²={f_data['metrics']['r2']}")
    print(f"  Insights: {f_data['insights']['summary_text']}")
    print(f"  Next 3 Months Forecast:")
    for pred in f_data["forecast_next_months"]:
        print(f"   - {pred['month_name']}: ${pred['forecast_revenue']:,} (Bounds: ${pred['lower_bound']:,} - ${pred['upper_bound']:,})")
    assert len(f_data["forecast_next_months"]) == 3
    assert f_data["metrics"]["mae"] is not None

    # 9. Categories list
    resp = client.get("/api/categories")
    assert resp.status_code == 200
    cats = resp.get_json()["data"]
    print(f"✓ Categories filter list: {cats}")

    # 10. Reset dataset
    resp = client.post("/api/reset")
    assert resp.status_code == 200
    print("✓ Reset dataset passed:", resp.get_json()["message"])

    # 11. Database status
    resp = client.get("/api/database/status")
    assert resp.status_code == 200
    db_stat = resp.get_json()["data"]
    print("✓ Database status passed:")
    print(f"  Dialect: {db_stat['dialect']}")
    print(f"  Connected: {db_stat['connected']}")
    print(f"  Total records in database table: {db_stat['total_rows']:,}")
    assert db_stat["connected"] is True
    assert db_stat["total_rows"] > 1000

    print("\nALL BACKEND API AND ML SERVICES TESTS PASSED SUCCESSFULLY! 🎉")

if __name__ == "__main__":
    test_backend()
