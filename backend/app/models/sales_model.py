"""
Data model representation and serialization for sales records.
"""
from dataclasses import dataclass
from typing import Optional

@dataclass
class SalesRecord:
    date: str
    product: str
    category: str
    quantity: int
    price: float

    @property
    def total_revenue(self) -> float:
        return round(self.quantity * self.price, 2)

    def to_dict(self):
        return {
            "date": self.date,
            "product": self.product,
            "category": self.category,
            "quantity": self.quantity,
            "price": self.price,
            "revenue": self.total_revenue
        }
