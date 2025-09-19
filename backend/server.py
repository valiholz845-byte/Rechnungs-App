from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64
from decimal import Decimal
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from jinja2 import Environment, FileSystemLoader
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from email.utils import formataddr

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Email configuration
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', '')
SENDER_NAME = os.environ.get('SENDER_NAME', 'RechnungsManager')

# Template environment
template_dir = ROOT_DIR / 'templates'
template_dir.mkdir(exist_ok=True)
jinja_env = Environment(
    loader=FileSystemLoader(template_dir),
    autoescape=True
)

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

# Email Service Class
class EmailService:
    def __init__(self):
        self.smtp_server = SMTP_SERVER
        self.smtp_port = SMTP_PORT
        self.username = SMTP_USERNAME
        self.password = SMTP_PASSWORD
        self.sender_email = SENDER_EMAIL
        self.sender_name = SENDER_NAME
    
    async def send_invoice_email(self, invoice: dict, customer: dict, company: dict) -> bool:
        """Send invoice email with PDF attachment"""
        try:
            if not self.username or not self.password:
                logger.warning("Email credentials not configured, skipping email send")
                return False
            
            # Generate PDF
            pdf_buffer = self.generate_invoice_pdf(invoice, customer, company)
            
            # Render email template
            template = jinja_env.get_template('german_invoice_email.html')
            html_body = template.render(
                invoice=invoice,
                customer=customer,
                company=company
            )
            
            # Create email message
            message = MIMEMultipart()
            message["From"] = formataddr((self.sender_name, self.sender_email))
            message["To"] = customer["email"]
            message["Subject"] = f"Rechnung {invoice['invoice_number']} von {company['company_name']}"
            
            # Add HTML body
            html_part = MIMEText(html_body, "html", "utf-8")
            message.attach(html_part)
            
            # Add PDF attachment
            if pdf_buffer:
                part = MIMEBase("application", "pdf")
                part.set_payload(pdf_buffer.getvalue())
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f"attachment; filename=Rechnung_{invoice['invoice_number']}.pdf"
                )
                message.attach(part)
            
            # Send email
            async with aiosmtplib.SMTP(
                hostname=self.smtp_server,
                port=self.smtp_port,
                use_tls=True
            ) as server:
                await server.login(self.username, self.password)
                await server.send_message(message)
            
            logger.info(f"Invoice email sent successfully to {customer['email']}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send invoice email: {str(e)}")
            return False
    
    def generate_invoice_pdf(self, invoice: dict, customer: dict, company: dict) -> io.BytesIO:
        """Generate PDF for invoice"""
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            styles = getSampleStyleSheet()
            story = []
            
            # Company header
            story.append(Paragraph(f"<b>{company['company_name']}</b>", styles['Title']))
            story.append(Paragraph(f"{company['address']}<br/>{company['postal_code']} {company['city']}", styles['Normal']))
            story.append(Spacer(1, 20))
            
            # Invoice title
            story.append(Paragraph(f"<b>RECHNUNG {invoice['invoice_number']}</b>", styles['Heading1']))
            story.append(Spacer(1, 12))
            
            # Customer info
            story.append(Paragraph("<b>Rechnungsadresse:</b>", styles['Normal']))
            story.append(Paragraph(f"{customer['name']}<br/>{customer['address']}<br/>{customer['postal_code']} {customer['city']}", styles['Normal']))
            story.append(Spacer(1, 20))
            
            # Invoice details
            invoice_date = datetime.fromisoformat(invoice['invoice_date']).strftime('%d.%m.%Y')
            due_date = datetime.fromisoformat(invoice['due_date']).strftime('%d.%m.%Y')
            
            details_data = [
                ['Rechnungsdatum:', invoice_date],
                ['Fälligkeitsdatum:', due_date]
            ]
            
            details_table = Table(details_data, colWidths=[100, 100])
            details_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ]))
            story.append(details_table)
            story.append(Spacer(1, 20))
            
            # Line items
            headers = ['Pos.', 'Beschreibung', 'Menge', 'Einzelpreis', 'Gesamt']
            table_data = [headers]
            
            for i, item in enumerate(invoice['items'], 1):
                row = [
                    str(i),
                    item['description'],
                    f"{item['quantity']:.2f}",
                    f"€{item['unit_price']:.2f}",
                    f"€{item['total_price']:.2f}"
                ]
                table_data.append(row)
            
            items_table = Table(table_data, colWidths=[30, 200, 60, 80, 80])
            items_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(items_table)
            story.append(Spacer(1, 20))
            
            # Totals
            totals_data = [
                ['Zwischensumme:', f"€{invoice['subtotal']:.2f}"],
                ['MwSt. (19%):', f"€{invoice['tax_amount']:.2f}"],
                ['<b>Gesamtbetrag:</b>', f"<b>€{invoice['total_amount']:.2f}</b>"]
            ]
            
            totals_table = Table(totals_data, colWidths=[300, 100])
            totals_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
            ]))
            story.append(totals_table)
            
            # Footer
            story.append(Spacer(1, 30))
            footer_text = f"""
            <b>Zahlungshinweise:</b><br/>
            Bitte überweisen Sie den Betrag bis zum {due_date}.<br/>
            Bank: {company.get('bank_name', 'N/A')}<br/>
            IBAN: {company.get('iban', 'N/A')}<br/>
            BIC: {company.get('bic', 'N/A')}<br/>
            Verwendungszweck: {invoice['invoice_number']}
            """
            story.append(Paragraph(footer_text, styles['Normal']))
            
            doc.build(story)
            buffer.seek(0)
            return buffer
            
        except Exception as e:
            logger.error(f"Failed to generate PDF: {str(e)}")
            return None

# Initialize email service
email_service = EmailService()

# Background task for sending invoice email
async def send_invoice_email_task(invoice_id: str):
    try:
        # Get invoice
        invoice = await db.invoices.find_one({"id": invoice_id})
        if not invoice:
            logger.error(f"Invoice not found: {invoice_id}")
            return
        
        # Get customer
        customer = await db.customers.find_one({"id": invoice["customer_id"]})
        if not customer:
            logger.error(f"Customer not found: {invoice['customer_id']}")
            return
        
        # Get company data
        company = await db.company_data.find_one({})
        if not company:
            # Use default company data
            company = {
                "company_name": "Ihre Firma GmbH",
                "address": "Musterstraße 123",
                "postal_code": "12345",
                "city": "Musterstadt",
                "phone": "+49 123 456789",
                "email": "info@ihrefirma.de",
                "website": "www.ihrefirma.de",
                "bank_name": "Deutsche Bank",
                "iban": "DE89 1234 5678 9012 3456 78",
                "bic": "DEUTDEDBXXX",
                "tax_number": "DE123456789"
            }
        
        # Send email
        success = await email_service.send_invoice_email(invoice, customer, company)
        
        if success:
            # Update invoice status
            await db.invoices.update_one(
                {"id": invoice_id},
                {"$set": {"status": "sent", "email_sent_at": datetime.now(timezone.utc).isoformat()}}
            )
            logger.info(f"Invoice {invoice['invoice_number']} email sent and status updated")
        
    except Exception as e:
        logger.error(f"Error in send_invoice_email_task: {str(e)}")

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
async def create_invoice(invoice_data: InvoiceCreate, background_tasks: BackgroundTasks):
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
        notes=invoice_data.notes,
        status="draft"  # Start as draft, will be updated to "sent" after email
    )
    
    invoice_data_dict = prepare_for_mongo(invoice.dict())
    await db.invoices.insert_one(invoice_data_dict)
    
    # Add background task for email sending
    if SMTP_USERNAME and SMTP_PASSWORD:
        background_tasks.add_task(send_invoice_email_task, invoice.id)
        logger.info(f"Invoice {invoice_number} created, email task scheduled")
    else:
        logger.warning(f"Invoice {invoice_number} created, but email not configured")
    
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

@api_router.post("/invoices/{invoice_id}/send-email")
async def send_invoice_email(invoice_id: str, background_tasks: BackgroundTasks):
    """Manually send invoice email"""
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        raise HTTPException(status_code=500, detail="Email service not configured")
    
    # Add background task for email sending
    background_tasks.add_task(send_invoice_email_task, invoice_id)
    
    return {"message": "Email send task scheduled successfully"}

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