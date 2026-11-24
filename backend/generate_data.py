"""
Generate a realistic 18-month sales dataset for the Sales Data Analysis Dashboard.
Covers January 2025 through June 2026 (~18 months).
Categories: Electronics, Fashion, Home, Grocery, Stationery.
Realistic growth trend + seasonality (Q4 bump, weekend cycles) + realistic product pricing.
"""
import csv
import random
from datetime import datetime, timedelta
import math

PRODUCTS = [
    # Electronics
    {"product": "Wireless Noise-Canceling Headphones", "category": "Electronics", "price": 149.99, "popularity": 1.2, "qty_range": (1, 3)},
    {"product": "Ultra HD Gaming Monitor 27\"", "category": "Electronics", "price": 329.50, "popularity": 0.8, "qty_range": (1, 2)},
    {"product": "Smart Fitness Watch V2", "category": "Electronics", "price": 89.99, "popularity": 1.4, "qty_range": (1, 4)},
    {"product": "USB-C Multiport Adapter Pro", "category": "Electronics", "price": 39.99, "popularity": 1.6, "qty_range": (1, 5)},
    {"product": "Mechanical Gaming Keyboard RGB", "category": "Electronics", "price": 119.00, "popularity": 1.0, "qty_range": (1, 2)},
    {"product": "Bluetooth Waterproof Speaker", "category": "Electronics", "price": 59.99, "popularity": 1.3, "qty_range": (1, 3)},
    {"product": "Fast Charging Wireless Stand", "category": "Electronics", "price": 29.99, "popularity": 1.5, "qty_range": (1, 4)},

    # Fashion
    {"product": "Classic Denim Jacket", "category": "Fashion", "price": 68.50, "popularity": 1.0, "qty_range": (1, 2)},
    {"product": "Organic Cotton Crewneck T-Shirt", "category": "Fashion", "price": 24.99, "popularity": 2.0, "qty_range": (1, 5)},
    {"product": "Slim-Fit Stretch Chino Pants", "category": "Fashion", "price": 45.00, "popularity": 1.2, "qty_range": (1, 3)},
    {"product": "Handcrafted Leather Slim Wallet", "category": "Fashion", "price": 35.00, "popularity": 1.1, "qty_range": (1, 3)},
    {"product": "All-Weather Performance Sneakers", "category": "Fashion", "price": 89.50, "popularity": 1.3, "qty_range": (1, 2)},
    {"product": "Polarized UV Aviator Sunglasses", "category": "Fashion", "price": 29.99, "popularity": 1.4, "qty_range": (1, 3)},

    # Home
    {"product": "Ergonomic Lumbar Office Chair", "category": "Home", "price": 249.00, "popularity": 0.7, "qty_range": (1, 2)},
    {"product": "Stainless Steel Vacuum Water Bottle 1L", "category": "Home", "price": 22.50, "popularity": 1.8, "qty_range": (1, 4)},
    {"product": "Ceramic Pour-Over Coffee Dripper", "category": "Home", "price": 34.00, "popularity": 1.0, "qty_range": (1, 2)},
    {"product": "Natural Aromatherapy Soy Candle Set", "category": "Home", "price": 19.99, "popularity": 1.5, "qty_range": (1, 4)},
    {"product": "Memory Foam Cooling Pillow", "category": "Home", "price": 42.00, "popularity": 1.1, "qty_range": (1, 3)},
    {"product": "Dimmable LED Smart Desk Lamp", "category": "Home", "price": 38.50, "popularity": 1.3, "qty_range": (1, 3)},

    # Grocery
    {"product": "Ceremonial Grade Matcha Powder 100g", "category": "Grocery", "price": 18.99, "popularity": 1.5, "qty_range": (1, 4)},
    {"product": "Cold Pressed Extra Virgin Olive Oil 500ml", "category": "Grocery", "price": 14.50, "popularity": 1.7, "qty_range": (1, 5)},
    {"product": "Raw Forest Wildflower Honey 500g", "category": "Grocery", "price": 12.99, "popularity": 1.6, "qty_range": (1, 4)},
    {"product": "Dark Roast Single-Origin Coffee Beans 1kg", "category": "Grocery", "price": 16.00, "popularity": 1.9, "qty_range": (1, 5)},
    {"product": "Organic Sprouted Grain Granola 400g", "category": "Grocery", "price": 8.50, "popularity": 2.1, "qty_range": (1, 6)},

    # Stationery
    {"product": "Hardcover Dotted Grid Journal A5", "category": "Stationery", "price": 15.50, "popularity": 1.6, "qty_range": (1, 4)},
    {"product": "Fine Point Quick-Dry Gel Pen Set (Pack of 8)", "category": "Stationery", "price": 12.00, "popularity": 2.2, "qty_range": (1, 6)},
    {"product": "Minimalist Desktop Acrylic Organizer", "category": "Stationery", "price": 21.00, "popularity": 1.0, "qty_range": (1, 3)},
    {"product": "Pastel Aesthetic Chisel Highlighters (6-Pack)", "category": "Stationery", "price": 7.50, "popularity": 2.4, "qty_range": (1, 5)},
    {"product": "Classic Brass Fountain Pen with Ink Cartridge", "category": "Stationery", "price": 32.00, "popularity": 0.8, "qty_range": (1, 2)},
]

def generate_sales_data(output_path="backend/data/sales.csv", default_backup_path="backend/data/default_sales.csv"):
    random.seed(42)  # Deterministic seed for reproducible baseline
    
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 6, 30)
    total_days = (end_date - start_date).days + 1
    
    records = []
    
    # Weights for products
    weights = [p["popularity"] for p in PRODUCTS]
    
    for day_offset in range(total_days):
        current_date = start_date + timedelta(days=day_offset)
        
        # Seasonality factors:
        # 1. Day of week (Friday/Saturday/Sunday have +25% volume)
        day_of_week = current_date.weekday()
        weekend_boost = 1.3 if day_of_week in [4, 5, 6] else 1.0
        
        # 2. Monthly growth trend: +2% per month
        months_passed = (current_date.year - 2025) * 12 + (current_date.month - 1)
        growth_multiplier = 1.0 + (months_passed * 0.022)
        
        # 3. Holiday/Q4 surge in November & December (+45% in Nov/Dec)
        month = current_date.month
        holiday_multiplier = 1.45 if month in [11, 12] else (1.15 if month in [7, 8] else 1.0)
        
        # Base daily orders ~ 4 to 8
        base_orders = random.randint(4, 8)
        num_orders = int(base_orders * weekend_boost * growth_multiplier * holiday_multiplier)
        
        # Generate transactions for this day
        for _ in range(num_orders):
            item = random.choices(PRODUCTS, weights=weights, k=1)[0]
            
            # Quantity with slight variance
            min_q, max_q = item["qty_range"]
            quantity = random.randint(min_q, max_q)
            
            # Slight price variance (± 5% discounts or promotions)
            discount_factor = random.choice([0.90, 0.95, 1.0, 1.0, 1.0, 1.05])
            unit_price = round(item["price"] * discount_factor, 2)
            
            # Transaction date string YYYY-MM-DD
            date_str = current_date.strftime("%Y-%m-%d")
            
            records.append({
                "date": date_str,
                "product": item["product"],
                "category": item["category"],
                "quantity": quantity,
                "price": unit_price
            })
            
    # Sort by date
    records.sort(key=lambda x: x["date"])
    
    fieldnames = ["date", "product", "category", "quantity", "price"]
    
    for target in [output_path, default_backup_path]:
        with open(target, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(records)
            
    print(f"Successfully generated {len(records)} realistic sales transactions to {output_path} and {default_backup_path}")

if __name__ == "__main__":
    generate_sales_data()
