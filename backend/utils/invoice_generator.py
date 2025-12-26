from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
import qrcode
from io import BytesIO
import os
from config import COMPANY_CONFIG, GST_RATE

def generate_invoice_pdf(order_data: dict, user_data: dict, items_data: list, file_path: str):
    """
    Generate GST-compliant invoice PDF
    """
    doc = SimpleDocTemplate(file_path, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=12
    )
    
    # Add company logo
    try:
        logo = Image(COMPANY_CONFIG['logo_url'], width=2*inch, height=0.8*inch)
        logo.hAlign = 'CENTER'
        story.append(logo)
    except:
        pass
    
    story.append(Spacer(1, 0.2*inch))
    
    # Invoice title
    story.append(Paragraph("TAX INVOICE", title_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Company details
    company_info = f"""
    <b>{COMPANY_CONFIG['legal_name']}</b><br/>
    {COMPANY_CONFIG['address']}<br/>
    GSTIN: {COMPANY_CONFIG['gst_number']}<br/>
    Phone: {COMPANY_CONFIG['phone']}<br/>
    Email: {COMPANY_CONFIG['email']}
    """
    story.append(Paragraph(company_info, styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    
    # Invoice details table
    invoice_details_data = [
        ['Invoice No:', order_data['id'][:8].upper(), 'Date:', datetime.fromisoformat(order_data['createdAt']).strftime('%d-%b-%Y')],
        ['Customer Type:', user_data['role'].capitalize(), 'Payment Method:', order_data['paymentMethod'].upper()],
    ]
    
    invoice_details_table = Table(invoice_details_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
    invoice_details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8FAFC')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
    ]))
    story.append(invoice_details_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Customer details
    story.append(Paragraph("<b>Bill To:</b>", heading_style))
    customer_info = f"""
    {user_data['name']}<br/>
    {user_data.get('businessName', '')}<br/>
    """
    if user_data.get('isGstRegistered') and user_data.get('gstNumber'):
        customer_info += f"GSTIN: {user_data['gstNumber']}<br/>"
    
    delivery_addr = order_data['deliveryAddress']
    customer_info += f"""
    {delivery_addr.get('street', '')}, {delivery_addr.get('city', '')}<br/>
    {delivery_addr.get('state', '')} - {delivery_addr.get('pincode', '')}<br/>
    Phone: {user_data['phone']}
    """
    story.append(Paragraph(customer_info, styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Items table
    story.append(Paragraph("<b>Order Details:</b>", heading_style))
    
    items_table_data = [['S.No', 'Product', 'Grade', 'Quantity (Bags)', 'Price/Bag (₹)', 'Amount (₹)']]
    
    subtotal = 0
    for idx, item in enumerate(items_data, 1):
        amount = item['quantity'] * item['price']
        subtotal += amount
        items_table_data.append([
            str(idx),
            item['brand'],
            item['grade'],
            str(item['quantity']),
            f"₹{item['price']:.2f}",
            f"₹{amount:.2f}"
        ])
    
    items_table = Table(items_table_data, colWidths=[0.5*inch, 2*inch, 1*inch, 1.2*inch, 1.3*inch, 1.5*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    story.append(items_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Totals section
    gst_amount = 0
    if user_data.get('isGstRegistered'):
        gst_amount = subtotal * GST_RATE
    
    card_surcharge = 0
    if order_data['paymentMethod'] == 'card':
        card_surcharge = subtotal * 0.02
    
    total = subtotal + gst_amount + card_surcharge
    
    totals_data = [
        ['', '', '', '', 'Subtotal:', f"₹{subtotal:.2f}"],
    ]
    
    if user_data.get('isGstRegistered'):
        totals_data.append(['', '', '', '', f'GST @ {int(GST_RATE * 100)}%:', f"₹{gst_amount:.2f}"])
    
    if card_surcharge > 0:
        totals_data.append(['', '', '', '', 'Card Surcharge (2%):', f"₹{card_surcharge:.2f}"])
    
    totals_data.append(['', '', '', '', '<b>Total Amount:</b>', f"<b>₹{total:.2f}</b>"])
    
    totals_table = Table(totals_data, colWidths=[0.5*inch, 2*inch, 1*inch, 1.2*inch, 1.3*inch, 1.5*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (4, 0), (4, -1), 'RIGHT'),
        ('ALIGN', (5, 0), (5, -1), 'RIGHT'),
        ('FONTNAME', (4, -1), (5, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (4, -1), (5, -1), 12),
        ('LINEABOVE', (4, -1), (5, -1), 2, colors.black),
        ('BACKGROUND', (4, -1), (5, -1), colors.HexColor('#F8FAFC')),
        ('TOPPADDING', (4, -1), (5, -1), 10),
        ('BOTTOMPADDING', (4, -1), (5, -1), 10),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Payment status
    payment_status = order_data.get('paymentStatus', 'pending').upper()
    status_color = '#16A34A' if payment_status == 'RECEIVED' else '#EAB308'
    payment_info = f'<b>Payment Status:</b> <font color="{status_color}">{payment_status}</font>'
    if order_data.get('transactionId'):
        payment_info += f'<br/><b>Transaction ID:</b> {order_data["transactionId"]}'
    story.append(Paragraph(payment_info, styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Driver details if available
    if order_data.get('driverName'):
        story.append(Paragraph("<b>Delivery Details:</b>", heading_style))
        driver_info = f"""
        <b>DRIVER NAME: {order_data['driverName'].upper()}</b><br/>
        <b>MOBILE: {order_data['driverMobile']}</b><br/>
        <b>VEHICLE: {order_data['vehicleNumber']}</b><br/>
        Delivery Status: {order_data.get('deliveryStatus', 'Pending').capitalize()}
        """
        story.append(Paragraph(driver_info, styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
    
    # Terms and conditions
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("<b>Terms & Conditions:</b>", heading_style))
    terms = """
    1. Minimum order quantity is 100 bags<br/>
    2. Orders cannot be cancelled once payment is initiated<br/>
    3. Delivery within 3-5 business days<br/>
    4. Final invoice will be generated after order confirmation<br/>
    5. For queries, contact: {}<br/>
    """.format(COMPANY_CONFIG['phone'])
    story.append(Paragraph(terms, styles['Normal']))
    
    # Footer
    story.append(Spacer(1, 0.5*inch))
    footer_text = f"""
    <para align=center>
    <b>Thank you for your business!</b><br/>
    {COMPANY_CONFIG['name']} | {COMPANY_CONFIG['phone']} | {COMPANY_CONFIG['email']}<br/>
    Instagram: {COMPANY_CONFIG['instagram']} | LinkedIn: {COMPANY_CONFIG['linkedin']}
    </para>
    """
    story.append(Paragraph(footer_text, styles['Normal']))
    
    # Build PDF
    doc.build(story)
    return file_path