from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64
from decimal import Decimal

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Serve static files for uploads
uploads_dir = ROOT_DIR / "uploads"
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Pydantic Models
class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    address: str
    postal_code: str
    city: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: str
    email: str
    address: str
    postal_code: str
    city: str

class CompanyData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    address: str
    postal_code: str
    city: str
    phone: str
    email: str
    website: Optional[str] = None
    tax_number: str
    bank_name: str
    iban: str
    bic: str
    logo_url: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyDataCreate(BaseModel):
    company_name: str
    address: str
    postal_code: str
    city: str
    phone: str
    email: str
    website: Optional[str] = None
    tax_number: str
    bank_name: str
    iban: str
    bic: str

class InvoiceItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # "service" or "product"
    description: str
    unit: str  # "hours", "pieces", "cm", "kg", etc.
    quantity: float
    unit_price: float
    total_price: float

class InvoiceItemCreate(BaseModel):
    type: str
    description: str
    unit: str
    quantity: float
    unit_price: float

class Invoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    customer_id: str
    customer_name: str
    items: List[InvoiceItem]
    subtotal: float
    tax_rate: float = 19.0  # Default German VAT
    tax_amount: float
    total_amount: float
    invoice_date: datetime
    due_date: datetime
    status: str = "draft"  # draft, sent, paid
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvoiceCreate(BaseModel):
    customer_id: str
    items: List[InvoiceItemCreate]
    invoice_date: str
    due_date: str
    notes: Optional[str] = None

# Helper functions
def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item, dict):
        for key, value in item.items():
            if isinstance(value, str) and key.endswith(('_at', '_date')):
                try:
                    item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    pass
    return item

# Customer endpoints
@api_router.post("/customers", response_model=Customer)
async def create_customer(customer: CustomerCreate):
    customer_dict = customer.dict()
    customer_obj = Customer(**customer_dict)
    customer_data = prepare_for_mongo(customer_obj.dict())
    await db.customers.insert_one(customer_data)
    return customer_obj

@api_router.get("/customers", response_model=List[Customer])
async def get_customers():
    customers = await db.customers.find().to_list(length=None)
    return [Customer(**parse_from_mongo(customer)) for customer in customers]

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**parse_from_mongo(customer))

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_update: CustomerCreate):
    existing_customer = await db.customers.find_one({"id": customer_id})
    if not existing_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_update.dict()
    update_data["id"] = customer_id
    update_data["created_at"] = existing_customer.get("created_at")
    
    customer_obj = Customer(**update_data)
    customer_data = prepare_for_mongo(customer_obj.dict())
    
    await db.customers.replace_one({"id": customer_id}, customer_data)
    return customer_obj

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str):
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

# Company Data endpoints
@api_router.post("/company", response_model=CompanyData)
async def create_or_update_company(company: CompanyDataCreate):
    # Check if company data exists
    existing_company = await db.company_data.find_one({})
    
    company_dict = company.dict()
    
    if existing_company:
        # Update existing
        company_obj = CompanyData(**{**company_dict, "id": existing_company["id"]})
        company_data = prepare_for_mongo(company_obj.dict())
        await db.company_data.replace_one({"id": existing_company["id"]}, company_data)
    else:
        # Create new
        company_obj = CompanyData(**company_dict)
        company_data = prepare_for_mongo(company_obj.dict())
        await db.company_data.insert_one(company_data)
    
    return company_obj

@api_router.get("/company", response_model=Optional[CompanyData])
async def get_company():
    company = await db.company_data.find_one({})
    if not company:
        return None
    return CompanyData(**parse_from_mongo(company))

# Invoice endpoints
@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_data: InvoiceCreate):
    # Get customer info
    customer = await db.customers.find_one({"id": invoice_data.customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Generate invoice number
    invoice_count = await db.invoices.count_documents({}) + 1
    invoice_number = f"INV-{invoice_count:04d}"
    
    # Calculate totals
    items = []
    subtotal = 0
    
    for item_data in invoice_data.items:
        total_price = item_data.quantity * item_data.unit_price
        item = InvoiceItem(
            **item_data.dict(),
            total_price=total_price
        )
        items.append(item)
        subtotal += total_price
    
    tax_amount = subtotal * 0.19  # 19% VAT
    total_amount = subtotal + tax_amount
    
    # Parse dates
    invoice_date = datetime.fromisoformat(invoice_data.invoice_date)
    due_date = datetime.fromisoformat(invoice_data.due_date)
    
    invoice = Invoice(
        invoice_number=invoice_number,
        customer_id=invoice_data.customer_id,
        customer_name=customer["name"],
        items=items,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=total_amount,
        invoice_date=invoice_date,
        due_date=due_date,
        notes=invoice_data.notes
    )
    
    invoice_data_dict = prepare_for_mongo(invoice.dict())
    await db.invoices.insert_one(invoice_data_dict)
    
    return invoice

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices():
    invoices = await db.invoices.find().sort("created_at", -1).to_list(length=None)
    return [Invoice(**parse_from_mongo(invoice)) for invoice in invoices]

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str):
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return Invoice(**parse_from_mongo(invoice))

@api_router.put("/invoices/{invoice_id}/status")
async def update_invoice_status(invoice_id: str, status: dict):
    result = await db.invoices.update_one(
        {"id": invoice_id}, 
        {"$set": {"status": status["status"]}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Status updated successfully"}

# Dashboard endpoints
@api_router.get("/dashboard/top-customers")
async def get_top_customers():
    pipeline = [
        {
            "$group": {
                "_id": "$customer_id",
                "customer_name": {"$first": "$customer_name"},
                "total_revenue": {"$sum": "$total_amount"},
                "invoice_count": {"$sum": 1}
            }
        },
        {"$sort": {"total_revenue": -1}},
        {"$limit": 5}
    ]
    
    top_customers = await db.invoices.aggregate(pipeline).to_list(length=5)
    
    # Enhance with customer details
    result = []
    for customer_data in top_customers:
        customer = await db.customers.find_one({"id": customer_data["_id"]})
        if customer:
            result.append({
                "id": customer_data["_id"],
                "name": customer_data["customer_name"],
                "total_revenue": customer_data["total_revenue"],
                "invoice_count": customer_data["invoice_count"],
                "city": customer.get("city", ""),
                "postal_code": customer.get("postal_code", "")
            })
    
    return result

@api_router.get("/dashboard/monthly-revenue")
async def get_monthly_revenue():
    pipeline = [
        {
            "$group": {
                "_id": {
                    "year": {"$year": {"$dateFromString": {"dateString": "$invoice_date"}}},
                    "month": {"$month": {"$dateFromString": {"dateString": "$invoice_date"}}}
                },
                "revenue": {"$sum": "$total_amount"}
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    
    monthly_data = await db.invoices.aggregate(pipeline).to_list(length=None)
    
    result = []
    for data in monthly_data:
        month_names = ["", "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", 
                      "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
        result.append({
            "month": f"{month_names[data['_id']['month']]} {data['_id']['year']}",
            "revenue": data["revenue"]
        })
    
    return result

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    total_customers = await db.customers.count_documents({})
    total_invoices = await db.invoices.count_documents({})
    
    # Total revenue
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}]
    revenue_result = await db.invoices.aggregate(pipeline).to_list(length=1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Pending invoices
    pending_invoices = await db.invoices.count_documents({"status": {"$ne": "paid"}})
    
    return {
        "total_customers": total_customers,
        "total_invoices": total_invoices,
        "total_revenue": total_revenue,
        "pending_invoices": pending_invoices
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()