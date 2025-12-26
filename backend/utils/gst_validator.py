import re

def validate_gst_number(gst_number: str) -> bool:
    """
    Validate GST number format
    Format: 22AAAAA0000A1Z5
    """
    if not gst_number:
        return False
    
    # GST pattern: 2 digits + 10 alphanumeric + 1 letter + 1 digit + 1 letter + 1 digit
    pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    return bool(re.match(pattern, gst_number.upper()))

def validate_quantity(quantity: int, min_qty: int = 100, multiples: list = [50, 100]) -> tuple:
    """
    Validate order quantity
    Returns: (is_valid: bool, error_message: str)
    """
    if quantity < min_qty:
        return False, f"Minimum order quantity is {min_qty} bags"
    
    # Check if quantity is a valid multiple
    is_valid_multiple = any(quantity % multiple == 0 for multiple in multiples)
    if not is_valid_multiple:
        return False, f"Quantity must be in multiples of {' or '.join(map(str, multiples))}"
    
    return True, ""