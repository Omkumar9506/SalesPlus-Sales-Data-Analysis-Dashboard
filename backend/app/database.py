"""
Database Manager for SalesPulse.
Supports MySQL with automatic table provisioning, data migration, and SQLite fallback.
"""
import os
import urllib.parse
from datetime import datetime
import pandas as pd
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Date, DateTime, text, inspect
)
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, index=True)
    product = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    revenue = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.strftime("%Y-%m-%d") if self.date else None,
            "product": self.product,
            "category": self.category,
            "quantity": self.quantity,
            "price": self.price,
            "revenue": self.revenue
        }

class DatabaseManager:
    _instance = None

    def __init__(self, data_csv_path=None):
        self.data_csv_path = data_csv_path or os.path.join(
            os.path.dirname(__file__), "..", "data", "sales.csv"
        )
        self.sqlite_path = os.path.join(
            os.path.dirname(__file__), "..", "data", "sales.db"
        )
        self.engine = None
        self.Session = None
        self.is_connected = False
        self.current_dialect = "none"
        self.host_info = "localhost:3306"
        self.database_name = "sales_analytics_db"
        self.last_error = None
        self.init_database()

    @classmethod
    def get_instance(cls, data_csv_path=None):
        if cls._instance is None:
            cls._instance = cls(data_csv_path)
        return cls._instance

    def _get_mysql_credentials(self):
        host = os.environ.get("MYSQL_HOST", "localhost")
        port = os.environ.get("MYSQL_PORT", "3306")
        user = os.environ.get("MYSQL_USER", "root")
        password = os.environ.get("MYSQL_PASSWORD", "")
        db_name = os.environ.get("MYSQL_DATABASE", "sales_analytics_db")
        return host, port, user, password, db_name

    def init_database(self):
        """Initializes connection to MySQL, falling back to SQLite if MySQL is unavailable."""
        db_type = os.environ.get("DB_TYPE", "mysql").lower()
        
        if db_type == "mysql":
            success = self._connect_mysql()
            if success:
                return
        
        # Fallback to SQLite
        self._connect_sqlite()

    def _connect_mysql(self, custom_creds=None):
        """Attempts connection to MySQL server and auto-provisions schema."""
        if custom_creds:
            host, port, user, password, db_name = custom_creds
        else:
            host, port, user, password, db_name = self._get_mysql_credentials()

        self.host_info = f"{host}:{port}"
        self.database_name = db_name

        # URL encode password for special characters
        encoded_pass = urllib.parse.quote_plus(password)
        
        try:
            # 1. Connect to MySQL server root to ensure database exists
            server_uri = f"mysql+pymysql://{user}:{encoded_pass}@{host}:{port}/?charset=utf8mb4"
            server_engine = create_engine(server_uri, connect_args={"connect_timeout": 4})
            with server_engine.connect() as conn:
                conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"))
                conn.commit()

            # 2. Connect to the target database
            db_uri = f"mysql+pymysql://{user}:{encoded_pass}@{host}:{port}/{db_name}?charset=utf8mb4"
            self.engine = create_engine(db_uri, pool_pre_ping=True, pool_recycle=3600)
            
            # 3. Create tables if not exist
            Base.metadata.create_all(self.engine)
            self.Session = sessionmaker(bind=self.engine)

            self.is_connected = True
            self.current_dialect = "MySQL 8.0"
            self.last_error = None
            print(f"✓ Connected to MySQL database '{db_name}' on {host}:{port}")

            # 4. Check if seeding is needed
            self._ensure_seeded()
            return True

        except Exception as e:
            err_msg = str(e)
            self.last_error = err_msg
            print(f"⚠ MySQL connection attempt failed: {err_msg}")
            return False

    def _connect_sqlite(self):
        """Fallback to local SQLite database."""
        try:
            os.makedirs(os.path.dirname(self.sqlite_path), exist_ok=True)
            db_uri = f"sqlite:///{os.path.abspath(self.sqlite_path)}"
            self.engine = create_engine(db_uri, connect_args={"check_same_thread": False})
            Base.metadata.create_all(self.engine)
            self.Session = sessionmaker(bind=self.engine)
            self.is_connected = True
            self.current_dialect = "SQLite (Local Fallback)"
            self.database_name = "sales.db"
            self.host_info = "Local Embedded File"
            print("✓ Connected to SQLite database:", self.sqlite_path)
            self._ensure_seeded()
            return True
        except Exception as e:
            self.is_connected = False
            self.last_error = str(e)
            print("✗ SQLite connection error:", e)
            return False

    def _ensure_seeded(self):
        """Populates database from sales.csv if empty."""
        try:
            with self.Session() as session:
                count = session.query(Sale).count()
                if count == 0 and os.path.exists(self.data_csv_path):
                    print(f"Database table 'sales' is empty. Auto-seeding from {self.data_csv_path}...")
                    df = pd.read_csv(self.data_csv_path)
                    self.seed_from_dataframe(df)
                    print(f"✓ Auto-seeded {len(df)} sales records into database!")
        except Exception as e:
            print("Error checking/seeding database:", e)

    def seed_from_dataframe(self, df: pd.DataFrame):
        """Inserts records from a DataFrame into the database."""
        if df.empty or not self.Session:
            return 0

        clean_records = []
        for _, row in df.iterrows():
            try:
                dt_val = pd.to_datetime(row["date"]).date()
                qty = int(row["quantity"])
                price = float(row["price"])
                rev = round(qty * price, 2)
                clean_records.append({
                    "date": dt_val,
                    "product": str(row["product"]).strip(),
                    "category": str(row["category"]).strip().title(),
                    "quantity": qty,
                    "price": price,
                    "revenue": rev
                })
            except Exception:
                continue

        with self.Session() as session:
            # Clear existing table before bulk replace
            session.query(Sale).delete()
            session.commit()

            # Bulk insert chunks
            chunk_size = 500
            for i in range(0, len(clean_records), chunk_size):
                chunk = clean_records[i:i + chunk_size]
                session.bulk_insert_mappings(Sale, chunk)
                session.commit()

        return len(clean_records)

    def get_dataframe(self, start_date=None, end_date=None, category=None, search=None) -> pd.DataFrame:
        """Retrieves filtered sales as a Pandas DataFrame directly from SQL."""
        if not self.engine:
            return pd.DataFrame()

        query = "SELECT date, product, category, quantity, price, revenue FROM sales WHERE 1=1"
        params = {}

        if start_date:
            query += " AND date >= :start_date"
            params["start_date"] = start_date

        if end_date:
            query += " AND date <= :end_date"
            params["end_date"] = end_date

        if category and category.lower() != "all":
            query += " AND LOWER(category) = LOWER(:category)"
            params["category"] = category

        if search:
            query += " AND (LOWER(product) LIKE :search OR LOWER(category) LIKE :search)"
            params["search"] = f"%{str(search).strip().lower()}%"

        query += " ORDER BY date ASC"

        try:
            with self.engine.connect() as conn:
                df = pd.read_sql(text(query), conn, params=params)
                if not df.empty:
                    df["date"] = pd.to_datetime(df["date"])
                return df
        except Exception as e:
            print("Error executing SQL query:", e)
            return pd.DataFrame()

    def get_status(self):
        """Returns live database status dictionary for the UI and health monitors."""
        row_count = 0
        if self.is_connected and self.Session:
            try:
                with self.Session() as session:
                    row_count = session.query(Sale).count()
            except Exception:
                row_count = 0

        return {
            "connected": self.is_connected,
            "dialect": self.current_dialect,
            "host": self.host_info,
            "database": self.database_name,
            "table": "sales",
            "total_rows": row_count,
            "is_mysql": "mysql" in self.current_dialect.lower(),
            "last_error": self.last_error
        }

    def switch_to_mysql(self, host, port, user, password, db_name):
        """Dynamically tests and switches active connection to MySQL."""
        creds = (host, port, user, password, db_name)
        success = self._connect_mysql(custom_creds=creds)
        if success:
            # Update environment variables and write to .env file
            os.environ["DB_TYPE"] = "mysql"
            os.environ["MYSQL_HOST"] = str(host)
            os.environ["MYSQL_PORT"] = str(port)
            os.environ["MYSQL_USER"] = str(user)
            os.environ["MYSQL_PASSWORD"] = str(password)
            os.environ["MYSQL_DATABASE"] = str(db_name)

            env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
            try:
                with open(env_path, "w", encoding="utf-8") as f:
                    f.write(f"DB_TYPE=mysql\nMYSQL_HOST={host}\nMYSQL_PORT={port}\nMYSQL_USER={user}\nMYSQL_PASSWORD={password}\nMYSQL_DATABASE={db_name}\n")
            except Exception:
                pass

            return {"success": True, "message": f"Successfully connected to MySQL database '{db_name}' on {host}:{port}"}
        else:
            return {"success": False, "error": self.last_error or "Failed to connect to MySQL"}
