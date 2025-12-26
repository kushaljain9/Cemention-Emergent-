import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import urllib.parse
from config import COMPANY_CONFIG

def send_email_notification(to_email: str, subject: str, body: str, attachment_path: str = None):
    """
    Send email notification using Gmail SMTP
    Note: Requires Gmail App Password to be configured
    """
    try:
        # Note: In production, store credentials in environment variables
        # For now, this is a placeholder that won't work without proper credentials
        sender_email = COMPANY_CONFIG['email']
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'html'))
        
        # Attach file if provided
        if attachment_path:
            with open(attachment_path, 'rb') as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {attachment_path.split("/")[-1]}'
                )
                msg.attach(part)
        
        # Note: This requires SMTP credentials to be configured
        # For development, we'll just return success
        print(f"Email notification prepared for: {to_email}")
        print(f"Subject: {subject}")
        return True
        
    except Exception as e:
        print(f"Email error: {str(e)}")
        return False

def generate_whatsapp_link(phone_number: str, message: str) -> str:
    """
    Generate WhatsApp click-to-send link (free, no API needed)
    """
    # Remove any non-numeric characters from phone
    clean_phone = ''.join(filter(str.isdigit, phone_number))
    
    # Add country code if not present (assuming India)
    if not clean_phone.startswith('91') and len(clean_phone) == 10:
        clean_phone = '91' + clean_phone
    
    # URL encode the message
    encoded_message = urllib.parse.quote(message)
    
    # Generate WhatsApp link
    whatsapp_url = f"https://wa.me/{clean_phone}?text={encoded_message}"
    
    return whatsapp_url

def create_order_notification_message(order_data: dict, user_data: dict, event: str) -> str:
    """
    Create notification message for different order events
    """
    order_id = order_data['id'][:8].upper()
    customer_name = user_data['name']
    role = user_data['role'].capitalize()
    total_amount = order_data['totalAmount']
    
    messages = {
        'order_placed': f"""
*Order Placed Successfully! 🎉*

Order ID: {order_id}
Customer: {customer_name}
Role: {role}
Total Amount: ₹{total_amount:.2f}
Payment Method: {order_data['paymentMethod'].upper()}
Payment Status: {order_data.get('paymentStatus', 'PENDING').upper()}

Delivery Address:
{order_data['deliveryAddress']['street']}
{order_data['deliveryAddress']['city']}, {order_data['deliveryAddress']['state']}
Pincode: {order_data['deliveryAddress']['pincode']}

Thank you for choosing Cemention!

For queries: {COMPANY_CONFIG['phone']}
        """,
        
        'payment_received': f"""
*Payment Received! ✅*

Order ID: {order_id}
Customer: {customer_name}
Amount: ₹{total_amount:.2f}
Transaction ID: {order_data.get('transactionId', 'N/A')}

Your order is now being processed.
Invoice has been generated and sent to your email.

For queries: {COMPANY_CONFIG['phone']}
        """,
        
        'payment_pending': f"""
*Payment Pending ⏳*

Order ID: {order_id}
Customer: {customer_name}
Amount: ₹{total_amount:.2f}

Please complete the payment to process your order.

Payment Details:
UPI: {COMPANY_CONFIG['upi_id']}
Account: {COMPANY_CONFIG['bank_account']}
IFSC: {COMPANY_CONFIG['bank_ifsc']}
Bank: {COMPANY_CONFIG['bank_name']}

For queries: {COMPANY_CONFIG['phone']}
        """,
        
        'driver_assigned': f"""
*Driver Assigned! 🚚*

Order ID: {order_id}
Customer: {customer_name}

*DRIVER DETAILS:*
*NAME: {order_data.get('driverName', 'TBD').upper()}*
*MOBILE: {order_data.get('driverMobile', 'TBD')}*
*VEHICLE: {order_data.get('vehicleNumber', 'TBD')}*

Your order will be delivered soon.

For queries: {COMPANY_CONFIG['phone']}
        """,
        
        'out_for_delivery': f"""
*Out for Delivery! 🚚*

Order ID: {order_id}
Customer: {customer_name}

Your order is on the way!

*DRIVER: {order_data.get('driverName', 'TBD').upper()}*
*MOBILE: {order_data.get('driverMobile', 'TBD')}*

Please be available at the delivery address.

For queries: {COMPANY_CONFIG['phone']}
        """,
        
        'delivered': f"""
*Order Delivered Successfully! ✅*

Order ID: {order_id}
Customer: {customer_name}

Thank you for choosing Cemention!

Please rate your experience and share feedback.

For queries: {COMPANY_CONFIG['phone']}
Website: www.cemention.com
        """
    }
    
    return messages.get(event, '')