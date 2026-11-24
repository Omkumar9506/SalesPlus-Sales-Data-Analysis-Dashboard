"""
Core Data Service for Sales Data Analytics.
Reads from CSV, filters, aggregates, computes KPIs, and handles dataset uploads/resets.
"""
import os
import shutil
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from app.utils.validators import validate_row, REQUIRED_COLUMNS
from app.database import DatabaseManager

class DataService:
    def __init__(self, data_path: str, default_data_path: str = None):
        self.data_path = data_path
        self.default_data_path = default_data_path
        self._cached_df = None
        self._last_mtime = None
        self.db = DatabaseManager.get_instance(data_path)


    def get_df(self, force_reload: bool = False) -> pd.DataFrame:
        """Loads and caches the sales DataFrame, reloading if file changed."""
        if not os.path.exists(self.data_path):
            if self.default_data_path and os.path.exists(self.default_data_path):
                shutil.copy(self.default_data_path, self.data_path)
            else:
                return pd.DataFrame(columns=["date", "product", "category", "quantity", "price", "revenue"])

        mtime = os.path.getmtime(self.data_path)
        if self._cached_df is not None and not force_reload and mtime == self._last_mtime:
            return self._cached_df.copy()

        try:
            df = pd.read_csv(self.data_path)
            
            # Normalize column names
            df.columns = [c.strip().lower() for c in df.columns]
            
            # Ensure required columns exist
            for col in REQUIRED_COLUMNS:
                if col not in df.columns:
                    df[col] = None

            # Clean and coerce types
            df["date"] = pd.to_datetime(df["date"], errors="coerce")
            df = df.dropna(subset=["date"])
            df["product"] = df["product"].astype(str).str.strip()
            df["category"] = df["category"].astype(str).str.strip().str.title()
            df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(0).astype(int)
            df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0.0).astype(float)
            
            # Filter valid
            df = df[(df["quantity"] > 0) & (df["price"] >= 0)]
            
            # Computed column: revenue
            df["revenue"] = (df["quantity"] * df["price"]).round(2)
            
            # Sort chronologically
            df = df.sort_values(by="date").reset_index(drop=True)
            
            self._cached_df = df
            self._last_mtime = mtime
            return df.copy()
        except Exception as e:
            print(f"Error loading sales data: {e}")
            return pd.DataFrame(columns=["date", "product", "category", "quantity", "price", "revenue"])

    def filter_data(self, start_date=None, end_date=None, category=None, search=None) -> pd.DataFrame:
        """Filters DataFrame by date range, category, and search text."""
        df = self.get_df()
        if df.empty:
            return df

        if start_date:
            try:
                s_dt = pd.to_datetime(start_date)
                df = df[df["date"] >= s_dt]
            except Exception:
                pass

        if end_date:
            try:
                # Include end date up to end of day
                e_dt = pd.to_datetime(end_date) + pd.Timedelta(days=1) - pd.Timedelta(nanoseconds=1)
                df = df[df["date"] <= e_dt]
            except Exception:
                pass

        if category and category.lower() != "all":
            df = df[df["category"].str.lower() == category.lower()]

        if search:
            q = str(search).strip().lower()
            df = df[df["product"].str.lower().str.contains(q, na=False) | 
                    df["category"].str.lower().str.contains(q, na=False)]

        return df

    def get_overview_metrics(self, start_date=None, end_date=None, category=None):
        """
        Computes executive KPI metrics with period-over-period comparison.
        """
        df = self.filter_data(start_date, end_date, category)
        
        if df.empty:
            return {
                "total_revenue": 0,
                "total_orders": 0,
                "total_units_sold": 0,
                "average_order_value": 0,
                "total_products": 0,
                "total_categories": 0,
                "comparison": {
                    "revenue_growth": 0.0,
                    "orders_growth": 0.0,
                    "units_growth": 0.0,
                    "aov_growth": 0.0,
                    "comparison_label": "No previous period data"
                },
                "date_range": {
                    "min_date": None,
                    "max_date": None,
                    "total_days": 0
                }
            }

        total_rev = float(df["revenue"].sum())
        total_orders = int(len(df))
        total_units = int(df["quantity"].sum())
        aov = round(total_rev / total_orders, 2) if total_orders > 0 else 0
        total_products = int(df["product"].nunique())
        total_categories = int(df["category"].nunique())
        
        min_date = df["date"].min().strftime("%Y-%m-%d")
        max_date = df["date"].max().strftime("%Y-%m-%d")
        period_days = (df["date"].max() - df["date"].min()).days + 1

        # Period comparison logic
        # Compare current period to the immediate preceding period of equal length
        current_start = df["date"].min()
        current_end = df["date"].max()
        duration = current_end - current_start
        
        prev_end = current_start - pd.Timedelta(days=1)
        prev_start = prev_end - duration
        
        full_df = self.get_df()
        prev_df = full_df[(full_df["date"] >= prev_start) & (full_df["date"] <= prev_end)]
        if category and category.lower() != "all":
            prev_df = prev_df[prev_df["category"].str.lower() == category.lower()]

        if not prev_df.empty and len(prev_df) > 0:
            prev_rev = float(prev_df["revenue"].sum())
            prev_orders = int(len(prev_df))
            prev_units = int(prev_df["quantity"].sum())
            prev_aov = round(prev_rev / prev_orders, 2) if prev_orders > 0 else 0

            def calc_growth(curr, prev):
                if prev == 0:
                    return 100.0 if curr > 0 else 0.0
                return round(((curr - prev) / prev) * 100.0, 1)

            comparison = {
                "revenue_growth": calc_growth(total_rev, prev_rev),
                "orders_growth": calc_growth(total_orders, prev_orders),
                "units_growth": calc_growth(total_units, prev_units),
                "aov_growth": calc_growth(aov, prev_aov),
                "previous_revenue": round(prev_rev, 2),
                "previous_orders": prev_orders,
                "comparison_label": f"vs prior {period_days} days ({prev_start.strftime('%b %d')} - {prev_end.strftime('%b %d, %Y')})"
            }
        else:
            # Fallback: compare first half to second half of current range if wide enough
            if period_days >= 14:
                mid_point = current_start + duration / 2
                first_half = df[df["date"] < mid_point]
                second_half = df[df["date"] >= mid_point]
                
                f_rev = float(first_half["revenue"].sum()) if not first_half.empty else 0
                s_rev = float(second_half["revenue"].sum()) if not second_half.empty else 0
                f_ord = len(first_half)
                s_ord = len(second_half)
                
                rev_growth = round(((s_rev - f_rev) / f_rev) * 100.0, 1) if f_rev > 0 else 0.0
                ord_growth = round(((s_ord - f_ord) / f_ord) * 100.0, 1) if f_ord > 0 else 0.0
                
                comparison = {
                    "revenue_growth": rev_growth,
                    "orders_growth": ord_growth,
                    "units_growth": rev_growth,
                    "aov_growth": 0.0,
                    "comparison_label": "2nd half vs 1st half of current timeframe"
                }
            else:
                comparison = {
                    "revenue_growth": 0.0,
                    "orders_growth": 0.0,
                    "units_growth": 0.0,
                    "aov_growth": 0.0,
                    "comparison_label": "Insufficient previous period data"
                }

        return {
            "total_revenue": round(total_rev, 2),
            "total_orders": total_orders,
            "total_units_sold": total_units,
            "average_order_value": aov,
            "total_products": total_products,
            "total_categories": total_categories,
            "comparison": comparison,
            "date_range": {
                "min_date": min_date,
                "max_date": max_date,
                "total_days": period_days
            }
        }

    def get_monthly_sales(self, start_date=None, end_date=None, category=None):
        """Aggregates sales by month."""
        df = self.filter_data(start_date, end_date, category)
        if df.empty:
            return []

        df["year_month"] = df["date"].dt.strftime("%Y-%m")
        grouped = df.groupby("year_month").agg(
            revenue=("revenue", "sum"),
            quantity=("quantity", "sum"),
            orders=("revenue", "count"),
            aov=("revenue", "mean")
        ).reset_index()

        result = []
        for _, row in grouped.iterrows():
            # Format month name e.g. "Jan 2025"
            dt_obj = datetime.strptime(row["year_month"], "%Y-%m")
            formatted_name = dt_obj.strftime("%b %Y")
            result.append({
                "period": row["year_month"],
                "month_name": formatted_name,
                "revenue": round(float(row["revenue"]), 2),
                "quantity": int(row["quantity"]),
                "orders": int(row["orders"]),
                "aov": round(float(row["aov"]), 2)
            })
        return result

    def get_daily_sales(self, start_date=None, end_date=None, category=None, limit_days=90):
        """Aggregates sales by day. Limits to recent days if range is wide to keep charts snappy."""
        df = self.filter_data(start_date, end_date, category)
        if df.empty:
            return []

        df["day_str"] = df["date"].dt.strftime("%Y-%m-%d")
        grouped = df.groupby("day_str").agg(
            revenue=("revenue", "sum"),
            quantity=("quantity", "sum"),
            orders=("revenue", "count")
        ).reset_index()

        # Sort and optionally limit to recent days if too many
        if len(grouped) > limit_days and not start_date:
            grouped = grouped.tail(limit_days)

        result = []
        for _, row in grouped.iterrows():
            dt_obj = datetime.strptime(row["day_str"], "%Y-%m-%d")
            result.append({
                "date": row["day_str"],
                "display_date": dt_obj.strftime("%b %d"),
                "revenue": round(float(row["revenue"]), 2),
                "quantity": int(row["quantity"]),
                "orders": int(row["orders"])
            })
        return result

    def get_category_sales(self, start_date=None, end_date=None):
        """Aggregates revenue and quantity by category."""
        df = self.filter_data(start_date, end_date)
        if df.empty:
            return []

        total_rev = df["revenue"].sum()
        grouped = df.groupby("category").agg(
            revenue=("revenue", "sum"),
            quantity=("quantity", "sum"),
            orders=("revenue", "count"),
            products=("product", "nunique")
        ).reset_index()

        # Sort descending by revenue
        grouped = grouped.sort_values(by="revenue", ascending=False)

        palette = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6"]

        result = []
        for idx, row in grouped.iterrows():
            rev = float(row["revenue"])
            pct = round((rev / total_rev) * 100.0, 1) if total_rev > 0 else 0
            result.append({
                "category": row["category"],
                "revenue": round(rev, 2),
                "quantity": int(row["quantity"]),
                "orders": int(row["orders"]),
                "products_count": int(row["products"]),
                "percentage": pct,
                "color": palette[len(result) % len(palette)]
            })
        return result

    def get_top_products(self, start_date=None, end_date=None, category=None, limit=10):
        """Returns top products by revenue and quantity."""
        df = self.filter_data(start_date, end_date, category)
        if df.empty:
            return {
                "by_revenue": [],
                "by_quantity": [],
                "all_products": []
            }

        grouped = df.groupby(["product", "category"]).agg(
            revenue=("revenue", "sum"),
            quantity=("quantity", "sum"),
            orders=("revenue", "count"),
            avg_price=("price", "mean")
        ).reset_index()

        top_by_rev = grouped.sort_values(by="revenue", ascending=False).head(limit)
        top_by_qty = grouped.sort_values(by="quantity", ascending=False).head(limit)
        all_sorted = grouped.sort_values(by="revenue", ascending=False)

        def format_records(dframe):
            items = []
            for _, r in dframe.iterrows():
                items.append({
                    "product": r["product"],
                    "category": r["category"],
                    "revenue": round(float(r["revenue"]), 2),
                    "quantity": int(r["quantity"]),
                    "orders": int(r["orders"]),
                    "avg_price": round(float(r["avg_price"]), 2)
                })
            return items

        return {
            "by_revenue": format_records(top_by_rev),
            "by_quantity": format_records(top_by_qty),
            "all_products": format_records(all_sorted),
            "total_products": len(grouped)
        }

    def get_recent_sales(self, page=1, page_size=15, search=None, category=None, 
                         start_date=None, end_date=None, sort_by="date", sort_order="desc"):
        """Returns paginated, searchable, sortable list of sales records."""
        df = self.filter_data(start_date, end_date, category, search)
        if df.empty:
            return {
                "records": [],
                "total_records": 0,
                "total_pages": 0,
                "current_page": page,
                "page_size": page_size
            }

        # Sorting
        valid_sort_cols = {
            "date": "date",
            "revenue": "revenue",
            "quantity": "quantity",
            "price": "price",
            "product": "product",
            "category": "category"
        }
        col = valid_sort_cols.get(sort_by, "date")
        ascending = (sort_order.lower() == "asc")
        
        df = df.sort_values(by=col, ascending=ascending)

        total_records = len(df)
        total_pages = max(1, (total_records + page_size - 1) // page_size)
        page = max(1, min(page, total_pages))
        
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_df = df.iloc[start_idx:end_idx]

        records = []
        for _, row in page_df.iterrows():
            records.append({
                "date": row["date"].strftime("%Y-%m-%d"),
                "product": row["product"],
                "category": row["category"],
                "quantity": int(row["quantity"]),
                "price": round(float(row["price"]), 2),
                "revenue": round(float(row["revenue"]), 2)
            })

        return {
            "records": records,
            "total_records": total_records,
            "total_pages": total_pages,
            "current_page": page,
            "page_size": page_size
        }

    def get_categories_list(self):
        """Returns distinct list of categories for filter dropdowns."""
        df = self.get_df()
        if df.empty:
            return []
        return sorted(df["category"].dropna().unique().tolist())

    def process_and_save_upload(self, file_storage) -> dict:
        """
        Validates, cleans, and saves an uploaded CSV file.
        Returns a detailed report.
        """
        try:
            # Read into pandas
            df_raw = pd.read_csv(file_storage)
            
            # Check column normalization
            raw_cols = [str(c).strip().lower() for c in df_raw.columns]
            missing_cols = [c for c in REQUIRED_COLUMNS if c not in raw_cols]
            
            if missing_cols:
                return {
                    "success": False,
                    "error": f"Missing required columns: {', '.join(missing_cols)}. Expected columns: {', '.join(REQUIRED_COLUMNS)}"
                }

            # Map to standard column names
            col_map = {}
            for original in df_raw.columns:
                cleaned = str(original).strip().lower()
                if cleaned in REQUIRED_COLUMNS:
                    col_map[original] = cleaned
            df_norm = df_raw.rename(columns=col_map)[REQUIRED_COLUMNS]

            valid_rows = []
            invalid_count = 0
            
            for _, row_dict in df_norm.iterrows():
                is_valid, res = validate_row(row_dict.to_dict())
                if is_valid:
                    valid_rows.append(res)
                else:
                    invalid_count += 1

            if not valid_rows:
                return {
                    "success": False,
                    "error": "No valid data rows found in uploaded CSV file. Please check row values and data types."
                }

            # Create clean DataFrame
            clean_df = pd.DataFrame(valid_rows)
            clean_df = clean_df.sort_values(by="date").reset_index(drop=True)
            
            # Write to CSV
            clean_df.to_csv(self.data_path, index=False)
            
            # Sync to active SQL database (MySQL / SQLite)
            if self.db:
                self.db.seed_from_dataframe(clean_df)

            # Reset cache
            self.get_df(force_reload=True)
            
            return {
                "success": True,
                "imported_rows": len(clean_df),
                "rejected_rows": invalid_count,
                "total_rows_processed": len(clean_df) + invalid_count,
                "date_range": {
                    "start": clean_df["date"].min(),
                    "end": clean_df["date"].max()
                },
                "total_revenue": round(float((clean_df["quantity"] * clean_df["price"]).sum()), 2),
                "categories": sorted(clean_df["category"].unique().tolist())
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to parse CSV file: {str(e)}"
            }

    def reset_to_default(self) -> dict:
        """Restores dataset to the default sample dataset."""
        if self.default_data_path and os.path.exists(self.default_data_path):
            shutil.copy(self.default_data_path, self.data_path)
            clean_df = self.get_df(force_reload=True)
            if self.db and not clean_df.empty:
                self.db.seed_from_dataframe(clean_df)
            return {"success": True, "message": "Successfully restored to default realistic sample dataset."}
        return {"success": False, "error": "Default sample dataset not found."}
