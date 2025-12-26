from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from config import COMPANY_CONFIG, PRICING_MULTIPLIER, MINIMUM_ORDER_QUANTITY, GST_RATE, CARD_SURCHARGE_RATE
from utils.gst_validator import validate_gst_number, validate_quantity
from utils.invoice_generator import generate_invoice_pdf
from utils.notifications import generate_whatsapp_link, create_order_notification_message, send_email_notification

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200

# Models
class Address(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    street: str
    city: str
    state: str
    pincode: str
    isDefault: bool = False

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    role: str
    businessName: Optional[str] = None
    isGstRegistered: bool = False
    gstNumber: Optional[str] = None
    gstRegisteredName: Optional[str] = None
    addresses: List[Address] = Field(default_factory=list)
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    role: str
    businessName: Optional[str] = None
    isGstRegistered: bool = False
    gstNumber: Optional[str] = None
    gstRegisteredName: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    brand: str
    grade: str
    basePrice: float
    image: str
    minQuantity: int = 100
    stock: int = 0
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProductCreate(BaseModel):
    brand: str
    grade: str
    basePrice: float
    image: str
    minQuantity: int = 100
    stock: int = 0

class CartItem(BaseModel):
    productId: str
    quantity: int
    price: float
    brand: str
    grade: str

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    items: List[CartItem] = Field(default_factory=list)
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    items: List[CartItem]
    totalAmount: float
    subtotal: float
    gstAmount: float = 0
    cardSurcharge: float = 0
    paymentMethod: str
    paymentStatus: str = "pending"
    transactionId: Optional[str] = None
    status: str = "pending"
    deliveryAddress: dict
    orderType: str = "normal"
    driverName: Optional[str] = None
    driverMobile: Optional[str] = None
    vehicleNumber: Optional[str] = None
    deliveryStatus: Optional[str] = None
    invoicePath: Optional[str] = None
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderCreate(BaseModel):
    items: List[CartItem]
    paymentMethod: str
    deliveryAddress: dict
    orderType: str = "normal"
    transactionId: Optional[str] = None

class RequestOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    brand: str
    quantity: int
    deliveryLocation: str
    phone: str
    preferredDate: str
    status: str = "pending"
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RequestOrderCreate(BaseModel):
    brand: str
    quantity: int
    deliveryLocation: str
    phone: str
    preferredDate: str

# Helper functions
def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def calculate_order_totals(items: List[CartItem], user: User, payment_method: str):
    subtotal = sum(item.quantity * item.price for item in items)
    gst_amount = subtotal * GST_RATE if user.isGstRegistered else 0
    card_surcharge = subtotal * CARD_SURCHARGE_RATE if payment_method == 'card' else 0
    total = subtotal + gst_amount + card_surcharge
    return subtotal, gst_amount, card_surcharge, total

# Auth endpoints
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate GST if provided
    if user_data.isGstRegistered and user_data.gstNumber:
        if not validate_gst_number(user_data.gstNumber):
            raise HTTPException(status_code=400, detail="Invalid GST number format")
    
    hashed_password = get_password_hash(user_data.password)
    user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        role=user_data.role,
        businessName=user_data.businessName,
        isGstRegistered=user_data.isGstRegistered,
        gstNumber=user_data.gstNumber,
        gstRegisteredName=user_data.gstRegisteredName
    )
    user_dict = user.model_dump()
    user_dict["password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    return {"token": access_token, "user": user}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    user_obj = User(**user)
    return {"token": access_token, "user": user_obj}

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Address endpoints
@api_router.post("/addresses")
async def add_address(address: Address, current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    addresses = user.get("addresses", [])
    
    # If this is the first address or marked as default, set it as default
    if len(addresses) == 0 or address.isDefault:
        for addr in addresses:
            addr["isDefault"] = False
        address.isDefault = True
    
    addresses.append(address.model_dump())
    await db.users.update_one({"id": current_user.id}, {"$set": {"addresses": addresses}})
    
    return {"message": "Address added successfully", "address": address}

@api_router.get("/addresses")
async def get_addresses(current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    return user.get("addresses", [])

@api_router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    addresses = [addr for addr in user.get("addresses", []) if addr["id"] != address_id]
    await db.users.update_one({"id": current_user.id}, {"$set": {"addresses": addresses}})
    return {"message": "Address deleted successfully"}

# Product endpoints
@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    return products

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    product = Product(**product_data.model_dump())
    await db.products.insert_one(product.model_dump())
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = product_data.model_dump()
    updated_product["id"] = product_id
    updated_product["createdAt"] = product["createdAt"]
    
    await db.products.update_one({"id": product_id}, {"$set": updated_product})
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# Cart endpoints
@api_router.get("/cart")
async def get_cart(current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"userId": current_user.id}, {"_id": 0})
    if not cart:
        return Cart(userId=current_user.id)
    return cart

@api_router.post("/cart")
async def add_to_cart(item: CartItem, current_user: User = Depends(get_current_user)):
    # Validate quantity
    is_valid, error_msg = validate_quantity(item.quantity)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    cart = await db.carts.find_one({"userId": current_user.id}, {"_id": 0})
    
    if not cart:
        cart = Cart(userId=current_user.id, items=[item.model_dump()])
        await db.carts.insert_one(cart.model_dump())
    else:
        items = cart.get("items", [])
        item_exists = False
        for i, existing_item in enumerate(items):
            if existing_item["productId"] == item.productId:
                items[i] = item.model_dump()
                item_exists = True
                break
        
        if not item_exists:
            items.append(item.model_dump())
        
        await db.carts.update_one(
            {"userId": current_user.id},
            {"$set": {"items": items, "updatedAt": datetime.now(timezone.utc).isoformat()}}
        )
        cart["items"] = items
    
    return cart

@api_router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"userId": current_user.id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = [item for item in cart.get("items", []) if item["productId"] != product_id]
    await db.carts.update_one(
        {"userId": current_user.id},
        {"$set": {"items": items, "updatedAt": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Item removed from cart"}

@api_router.delete("/cart")
async def clear_cart(current_user: User = Depends(get_current_user)):
    await db.carts.update_one(
        {"userId": current_user.id},
        {"$set": {"items": [], "updatedAt": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Cart cleared"}

# Order endpoints  
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    # Validate quantities
    for item in order_data.items:
        is_valid, error_msg = validate_quantity(item.quantity)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
    
    # Calculate totals
    subtotal, gst_amount, card_surcharge, total = calculate_order_totals(
        order_data.items, current_user, order_data.paymentMethod
    )
    
    # Determine payment status
    payment_status = "pending"
    if order_data.paymentMethod == "cod":
        payment_status = "cod"
    elif order_data.transactionId:
        payment_status = "verification_pending"
    
    order = Order(
        userId=current_user.id,
        items=order_data.items,
        subtotal=subtotal,
        gstAmount=gst_amount,
        cardSurcharge=card_surcharge,
        totalAmount=total,
        paymentMethod=order_data.paymentMethod,
        paymentStatus=payment_status,
        transactionId=order_data.transactionId,
        deliveryAddress=order_data.deliveryAddress,
        orderType=order_data.orderType
    )
    
    await db.orders.insert_one(order.model_dump())
    await db.carts.update_one(
        {"userId": current_user.id},
        {"$set": {"items": [], "updatedAt": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send notification
    user_dict = current_user.model_dump()
    order_dict = order.model_dump()
    message = create_order_notification_message(order_dict, user_dict, 'order_placed')
    whatsapp_link = generate_whatsapp_link(COMPANY_CONFIG['whatsapp'], message)
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    else:
        orders = await db.orders.find({"userId": current_user.id}, {"_id": 0}).to_list(1000)
    return orders

@api_router.put("/orders/{order_id}/payment-status")
async def update_payment_status(order_id: str, payment_status: str, transaction_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {"paymentStatus": payment_status}
    if transaction_id:
        update_data["transactionId"] = transaction_id
    
    result = await db.orders.update_one({"id": order_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # If payment received, generate invoice
    if payment_status == "received":
        order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        user = await db.users.find_one({"id": order["userId"]}, {"_id": 0})
        
        # Generate invoice
        invoice_dir = Path("/app/invoices")
        invoice_dir.mkdir(exist_ok=True)
        invoice_path = str(invoice_dir / f"invoice_{order_id[:8]}.pdf")
        
        generate_invoice_pdf(order, user, order["items"], invoice_path)
        
        await db.orders.update_one({"id": order_id}, {"$set": {"invoicePath": invoice_path}})
        
        # Send notification
        message = create_order_notification_message(order, user, 'payment_received')
        whatsapp_link = generate_whatsapp_link(COMPANY_CONFIG['whatsapp'], message)
    
    return {"message": "Payment status updated"}

@api_router.put("/orders/{order_id}/driver")
async def assign_driver(order_id: str, driver_name: str, driver_mobile: str, vehicle_number: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "driverName": driver_name,
            "driverMobile": driver_mobile,
            "vehicleNumber": vehicle_number,
            "deliveryStatus": "driver_assigned"
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Send notification
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    user = await db.users.find_one({"id": order["userId"]}, {"_id": 0})
    message = create_order_notification_message(order, user, 'driver_assigned')
    whatsapp_link = generate_whatsapp_link(user["phone"], message)
    
    return {"message": "Driver assigned", "whatsapp_link": whatsapp_link}

@api_router.put("/orders/{order_id}/delivery-status")
async def update_delivery_status(order_id: str, delivery_status: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.orders.update_one({"id": order_id}, {"$set": {"deliveryStatus": delivery_status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Send notification
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    user = await db.users.find_one({"id": order["userId"]}, {"_id": 0})
    
    event_map = {
        "out_for_delivery": "out_for_delivery",
        "delivered": "delivered"
    }
    
    if delivery_status in event_map:
        message = create_order_notification_message(order, user, event_map[delivery_status])
        whatsapp_link = generate_whatsapp_link(user["phone"], message)
    
    return {"message": "Delivery status updated"}

@api_router.get("/orders/{order_id}/invoice")
async def download_invoice(order_id: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check authorization
    if current_user.role != "admin" and order["userId"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not order.get("invoicePath") or not os.path.exists(order["invoicePath"]):
        raise HTTPException(status_code=404, detail="Invoice not generated yet")
    
    return FileResponse(order["invoicePath"], media_type="application/pdf", filename=f"invoice_{order_id[:8]}.pdf")

# Request Order endpoints
@api_router.post("/request-orders", response_model=RequestOrder)
async def create_request_order(request_data: RequestOrderCreate, current_user: User = Depends(get_current_user)):
    # Validate quantity
    is_valid, error_msg = validate_quantity(request_data.quantity)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    request_order = RequestOrder(
        userId=current_user.id,
        brand=request_data.brand,
        quantity=request_data.quantity,
        deliveryLocation=request_data.deliveryLocation,
        phone=request_data.phone,
        preferredDate=request_data.preferredDate
    )
    
    await db.request_orders.insert_one(request_order.model_dump())
    return request_order

@api_router.get("/request-orders", response_model=List[RequestOrder])
async def get_request_orders(current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        orders = await db.request_orders.find({}, {"_id": 0}).to_list(1000)
    else:
        orders = await db.request_orders.find({"userId": current_user.id}, {"_id": 0}).to_list(1000)
    return orders

@api_router.put("/request-orders/{request_id}")
async def update_request_order_status(request_id: str, status: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.request_orders.update_one({"id": request_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Request order not found")
    
    return {"message": "Request order status updated"}

# Admin endpoints
@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.put("/admin/users/{user_id}")
async def update_user_role(user_id: str, role: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User role updated"}

@api_router.get("/admin/analytics")
async def get_analytics(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all orders
    orders = await db.orders.find({}, {"_id": 0}).to_list(10000)
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(10000)
    
    # Calculate analytics
    total_revenue = sum(order["totalAmount"] for order in orders if order.get("paymentStatus") == "received")
    pending_revenue = sum(order["totalAmount"] for order in orders if order.get("paymentStatus") in ["pending", "verification_pending"])
    
    gst_orders = [order for order in orders if order.get("gstAmount", 0) > 0]
    non_gst_orders = [order for order in orders if order.get("gstAmount", 0) == 0]
    
    # Role-wise breakdown
    role_sales = {}
    for order in orders:
        if order.get("paymentStatus") == "received":
            user = next((u for u in users if u["id"] == order["userId"]), None)
            if user:
                role = user["role"]
                role_sales[role] = role_sales.get(role, 0) + order["totalAmount"]
    
    return {
        "total_revenue": total_revenue,
        "pending_revenue": pending_revenue,
        "total_orders": len(orders),
        "gst_orders": len(gst_orders),
        "non_gst_orders": len(non_gst_orders),
        "role_sales": role_sales,
        "total_users": len(users)
    }

@api_router.get("/config")
async def get_config():
    return {
        "company": COMPANY_CONFIG,
        "pricing": PRICING_MULTIPLIER,
        "minOrderQty": MINIMUM_ORDER_QUANTITY,
        "gstRate": GST_RATE,
        "cardSurcharge": CARD_SURCHARGE_RATE
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()