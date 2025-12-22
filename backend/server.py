from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    role: str
    addresses: List[dict] = Field(default_factory=list)
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    role: str

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
    paymentMethod: str
    status: str = "pending"
    deliveryAddress: dict
    orderType: str = "normal"
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderCreate(BaseModel):
    items: List[CartItem]
    totalAmount: float
    paymentMethod: str
    deliveryAddress: dict
    orderType: str = "normal"

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

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        role=user_data.role
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

@api_router.get("/cart")
async def get_cart(current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"userId": current_user.id}, {"_id": 0})
    if not cart:
        return Cart(userId=current_user.id)
    return cart

@api_router.post("/cart")
async def add_to_cart(item: CartItem, current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"userId": current_user.id}, {"_id": 0})
    
    if not cart:
        cart = Cart(userId=current_user.id, items=[item.model_dump()])
        await db.carts.insert_one(cart.model_dump())
    else:
        items = cart.get("items", [])
        item_exists = False
        for i, existing_item in enumerate(items):
            if existing_item["productId"] == item.productId:
                items[i]["quantity"] = item.quantity
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

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    order = Order(
        userId=current_user.id,
        items=order_data.items,
        totalAmount=order_data.totalAmount,
        paymentMethod=order_data.paymentMethod,
        deliveryAddress=order_data.deliveryAddress,
        orderType=order_data.orderType
    )
    
    await db.orders.insert_one(order.model_dump())
    await db.carts.update_one(
        {"userId": current_user.id},
        {"$set": {"items": [], "updatedAt": datetime.now(timezone.utc).isoformat()}}
    )
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    else:
        orders = await db.orders.find({"userId": current_user.id}, {"_id": 0}).to_list(1000)
    return orders

@api_router.put("/orders/{order_id}")
async def update_order_status(order_id: str, status: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

@api_router.post("/request-orders", response_model=RequestOrder)
async def create_request_order(request_data: RequestOrderCreate, current_user: User = Depends(get_current_user)):
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