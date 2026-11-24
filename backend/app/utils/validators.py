"""
Validation utilities for sales data ingestion and query parameters.
"""
from datetime import datetime
import re

REQUIRED_COLUMNS = ["date", "product", "category", "quantity", "price"]

def validate_date(date_str):
    """
    Validates and standardizes a date string to YYYY-MM-DD.
    Accepts formats: YYYY-MM-DD, YYYY/MM/DD, MM/DD/YYYY, DD-MM-YYYY, etc.
    """
    if not date_str or not isinstance(date_str, str):
        return None
    
    date_str = date_str.strip()
    formats_to_try = [
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%m-%d-%Y",
        "%Y-%m-%d %H:%M:%S"
    ]
    for fmt in formats_to_try:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None

def validate_row(row):
    """
    Validates a single row dictionary from CSV.
    Returns: (is_valid: bool, cleaned_row: dict or error_reason: str)
    """
    # Normalize keys to lowercase stripped
    norm = {str(k).strip().lower(): v for k, v in row.items()}
    
    for col in REQUIRED_COLUMNS:
        if col not in norm or norm[col] is None or str(norm[col]).strip() == "":
            return False, f"Missing required column: {col}"
    
    # Validate date
    std_date = validate_date(str(norm["date"]))
    if not std_date:
        return False, f"Invalid date format: {norm['date']}"
    
    # Validate product & category
    product = str(norm["product"]).strip()
    category = str(norm["category"]).strip().title()
    if len(product) == 0:
        return False, "Product name cannot be empty"
    if len(category) == 0:
        return False, "Category cannot be empty"
    
    # Validate quantity
    try:
        quantity = int(float(norm["quantity"]))
        if quantity <= 0:
            return False, f"Quantity must be positive: {norm['quantity']}"
    except (ValueError, TypeError):
        return False, f"Quantity must be a valid number: {norm['quantity']}"
        
    # Validate price
    try:
        # Remove currency symbols if present ($ € £)
        cleaned_price = re.sub(r"[^\d.]", "", str(norm["price"]))
        price = float(cleaned_price)
        if price < 0:
            return False, f"Price cannot be negative: {norm['price']}"
    except (ValueError, TypeError):
        return False, f"Price must be a valid number: {norm['price']}"
        
    return True, {
        "date": std_date,
        "product": product,
        "category": category,
        "quantity": quantity,
        "price": round(price, 2)
    }
