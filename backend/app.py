
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import get_db, create_tables, WabaData, WabaPhoneNumber
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
business_portfolio_id = os.getenv("BUSINESS_PORTFOLIO_ID")
FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET")

app = FastAPI()

# Initialize database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()
    print("Database tables created successfully")

# CORS settings: allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Pydantic model for request body
class PhoneNumberRequest(BaseModel):
    phone_number: str

class WabaRequest(BaseModel):
    code: str
    waba_id: str


@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/phone-numbers")
async def get_phone_numbers():

    try:
        # Use business portfolio ID from environment variables
        if not business_portfolio_id:
            return {"error": "BUSINESS_PORTFOLIO_ID not found in environment variables"}
            
        # Facebook Graph API endpoint - use preverified_numbers endpoint
        url = f"https://graph.facebook.com/v18.0/{business_portfolio_id}/preverified_numbers"
        
        
        if not ACCESS_TOKEN:
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Add access token and fields to request parameters
        params = {
            "access_token": ACCESS_TOKEN,
            "fields": "id,phone_number,code_verification_status,verification_expiry_time"
        }
        
        # Make the request to Facebook Graph API
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            
        return response.json()
        
    except Exception as e:
        return {"error": f"Failed to retrieve phone numbers: {str(e)}"}

@app.get("/wabas")
async def get_wabas():
    try:
        # Use business portfolio ID from environment variables
        if not business_portfolio_id:
            return {"error": "BUSINESS_PORTFOLIO_ID not found in environment variables"}
            
        if not ACCESS_TOKEN:
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for owned WhatsApp Business Accounts
        url = f"https://graph.facebook.com/v18.0/{business_portfolio_id}/owned_whatsapp_business_accounts"
        
        # Add access token to request parameters
        params = {
            "access_token": ACCESS_TOKEN
        }
        
        # Make the request to Facebook Graph API
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            
        owned_data = response.json()
        return owned_data
        
    except Exception as e:
        return {"error": f"Failed to retrieve WABAs: {str(e)}"}

@app.get("/client-wabas")
async def get_client_wabas():
    try:
        # Use business portfolio ID from environment variables
        if not business_portfolio_id:
            return {"error": "BUSINESS_PORTFOLIO_ID not found in environment variables"}
            
        if not ACCESS_TOKEN:
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for client WhatsApp Business Accounts
        url = f"https://graph.facebook.com/v18.0/{business_portfolio_id}/client_whatsapp_business_accounts"
        
        # Add access token and filtering to request parameters
        params = {
            "access_token": ACCESS_TOKEN,
            "filtering": f'[{{"field":"partners","operator":"ALL","value":["{business_portfolio_id}"]}}]'
        }
        
        # Make the request to Facebook Graph API
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            
        client_data = response.json()
        return client_data
        
    except Exception as e:
        return {"error": f"Failed to retrieve client WABAs: {str(e)}"}

@app.get("/waba-phone-numbers/{waba_id}")
async def get_waba_phone_numbers(waba_id: str, db: Session = Depends(get_db)):
    try:
        # Try to get business token from database first
        waba_data = db.query(WabaData).filter(WabaData.waba_id == waba_id).first()
        access_token = waba_data.access_token if waba_data else ACCESS_TOKEN
        
        if not access_token:
            return {"error": "No access token available"}
        
        # Facebook Graph API endpoint for WABA phone numbers
        url = f"https://graph.facebook.com/v18.0/{waba_id}/phone_numbers"
        
        # Add access token to request parameters
        params = {
            "access_token": access_token
        }
        
        # Make the request to Facebook Graph API
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            
        data = response.json()
        
        # Store phone numbers in database if we have WABA data
        if waba_data and data.get('data'):
            print(f"Storing {len(data['data'])} phone numbers for WABA {waba_id}")
            
            for phone_data in data['data']:
                # Check if phone number already exists
                existing_phone = db.query(WabaPhoneNumber).filter(
                    WabaPhoneNumber.phone_number_id == phone_data['id']
                ).first()
                
                if existing_phone:
                    # Update existing phone number
                    existing_phone.display_phone_number = phone_data.get('display_phone_number', '')
                    existing_phone.code_verification_status = phone_data.get('code_verification_status')
                    existing_phone.verification_expiry_time = phone_data.get('verification_expiry_time')
                    existing_phone.updated_at = datetime.utcnow()
                    print(f"Updated phone number: {phone_data.get('display_phone_number', '')}")
                else:
                    # Create new phone number record
                    new_phone = WabaPhoneNumber(
                        phone_number_id=phone_data['id'],
                        waba_id=waba_id,
                        display_phone_number=phone_data.get('display_phone_number', ''),
                        code_verification_status=phone_data.get('code_verification_status'),
                        verification_expiry_time=phone_data.get('verification_expiry_time')
                    )
                    db.add(new_phone)
                    print(f"Added new phone number: {phone_data.get('display_phone_number', '')}")
            
            try:
                db.commit()
                print(f"Successfully stored phone numbers for WABA {waba_id}")
            except Exception as e:
                db.rollback()
                print(f"Error storing phone numbers: {str(e)}")
        
        # Print all available fields
        if data.get('data') and len(data['data']) > 0:
            first_phone = data['data'][0]
            print(f"Available fields: {list(first_phone.keys())}")
        
        return data
        
    except Exception as e:
        return {"error": f"Failed to retrieve WABA phone numbers: {str(e)}"}

@app.post("/add-phone-number")
async def add_phone_number(request: PhoneNumberRequest):
    try:
        print(f"\n=== Add Phone Number Endpoint Called ===")
        print(f"Request received: {request}")
        phone_number = request.phone_number
        print(f"Phone number extracted: {phone_number}")
        print(f"=== Adding Phone Number: {phone_number} ===")
        
        # Use business portfolio ID from environment variables
        if not business_portfolio_id:
            print("BUSINESS_PORTFOLIO_ID not found in environment variables")
            return {"error": "BUSINESS_PORTFOLIO_ID not found in environment variables"}
            
        if not ACCESS_TOKEN:
            print("ACCESS_TOKEN not found in environment variables")
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for adding phone numbers
        url = f"https://graph.facebook.com/v18.0/{business_portfolio_id}/add_phone_numbers"
        print(f"Calling Facebook API: {url}")
        
        # Prepare the request data
        data = {
            "phone_number": phone_number
        }
        print(f"Request data: {data}")
        
        # Add access token to request parameters
        params = {
            "access_token": ACCESS_TOKEN
        }
        
        # Make the POST request to Facebook Graph API
        response = requests.post(url, json=data, params=params)
        
        print(f"Response Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
        if response.status_code != 200:
            print(f"Error: Facebook API returned status {response.status_code}")
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
        
        response_data = response.json()
        print(f"Success: Phone number added successfully")
        print(f"Response data: {response_data}")
        print("=" * 50)
            
        return response_data
        
    except Exception as e:
        print(f"Exception occurred: {str(e)}")
        return {"error": f"Failed to add phone number: {str(e)}"}

@app.delete("/delete-phone-number/{number_id}")
async def delete_phone_number(number_id: str):
    try:
        if not ACCESS_TOKEN:
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for deleting phone numbers
        url = f"https://graph.facebook.com/v18.0/{number_id}"
        
        # Add access token to request parameters
        params = {
            "access_token": ACCESS_TOKEN
        }
        
        # Make the DELETE request to Facebook Graph API
        response = requests.delete(url, params=params)
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            
        return response.json()
        
    except Exception as e:
        return {"error": f"Failed to delete phone number: {str(e)}"}

@app.post("/request-verification-code/{number_id}")
async def request_verification_code(number_id: str):
    try:
        print(f"\n=== Requesting Verification Code for Phone Number ID: {number_id} ===")
        
        if not ACCESS_TOKEN:
            print("ACCESS_TOKEN not found in environment variables")
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # First, get the phone number details to show which number we're sending SMS to
        phone_details_url = f"https://graph.facebook.com/v18.0/{number_id}"
        phone_params = {
            "access_token": ACCESS_TOKEN,
            "fields": "phone_number,code_verification_status"
        }
        
        print(f"Getting phone number details from: {phone_details_url}")
        phone_response = requests.get(phone_details_url, params=phone_params)
        
        if phone_response.status_code == 200:
            phone_data = phone_response.json()
            print(f"Phone Number Details: {phone_data}")
            print(f"SMS will be sent to: {phone_data.get('phone_number', 'Unknown')}")
            print(f"Current verification status: {phone_data.get('code_verification_status', 'Unknown')}")
        else:
            print(f"Failed to get phone number details: {phone_response.status_code}")
        
        # Facebook Graph API endpoint for requesting verification code
        url = f"https://graph.facebook.com/v18.0/{number_id}/request_code"
        print(f"Calling Facebook API: {url}")
        
        # Add access token and required parameters
        params = {
            "access_token": ACCESS_TOKEN,
            "code_method": "SMS",
            "language": "en_US"
        }
        print(f"Request parameters: {params}")
        
        # Make the POST request to Facebook Graph API
        response = requests.post(url, params=params)
        
        print(f"Response Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
        if response.status_code != 200:
            print(f"Error: Facebook API returned status {response.status_code}")
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
        
        response_data = response.json()
        print(f"Success: Verification code requested successfully")
        print(f"Response data: {response_data}")
        print("=" * 50)
            
        return response_data
        
    except Exception as e:
        print(f"Exception occurred: {str(e)}")
        return {"error": f"Failed to request verification code: {str(e)}"}

@app.post("/verify-code/{number_id}")
async def verify_code(number_id: str, code: str):
    try:
        print(f"\n=== Verifying Code for Phone Number ID: {number_id} ===")
        print(f"Verification Code: {code}")
        
        if not ACCESS_TOKEN:
            print("ACCESS_TOKEN not found in environment variables")
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for verifying code
        url = f"https://graph.facebook.com/v18.0/{number_id}/verify_code"
        print(f"Calling Facebook API: {url}")
        
        # Add access token and verification code
        params = {
            "access_token": ACCESS_TOKEN,
            "code": code
        }
        print(f"Request parameters: {params}")
        
        # Make the POST request to Facebook Graph API
        response = requests.post(url, params=params)
        
        print(f"Response Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
        if response.status_code != 200:
            print(f"Error: Facebook API returned status {response.status_code}")
            error_response = {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            # Return the error with the same status code from Facebook
            raise HTTPException(status_code=response.status_code, detail=error_response)
        
        response_data = response.json()
        print(f"Success: Code verified successfully")
        print(f"Response data: {response_data}")
        print("=" * 50)
            
        return response_data
        
    except HTTPException:
        # Re-raise HTTPExceptions so they propagate properly
        raise
    except Exception as e:
        print(f"Exception occurred: {str(e)}")
        return {"error": f"Failed to verify code: {str(e)}"}

@app.post("/register-phone-number/{waba_phone_number_id}")
async def register_phone_number(waba_phone_number_id: str, pin: str, db: Session = Depends(get_db)):
    try:
        # Try to find the WABA ID for this phone number from our database
        phone_record = db.query(WabaPhoneNumber).filter(
            WabaPhoneNumber.phone_number_id == waba_phone_number_id
        ).first()
        
        if phone_record:
            # We found the WABA, try to use its business token
            waba_data = db.query(WabaData).filter(WabaData.waba_id == phone_record.waba_id).first()
            access_token = waba_data.access_token if waba_data else ACCESS_TOKEN
            print(f"Using business token for WABA {phone_record.waba_id} to register phone {waba_phone_number_id}")
        else:
            # Fall back to global token
            access_token = ACCESS_TOKEN
            print(f"Phone number {waba_phone_number_id} not found in database, using global token")
        
        if not access_token:
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for registering phone number
        url = f"https://graph.facebook.com/v18.0/{waba_phone_number_id}/register"
        
        # Prepare the request body
        request_body = {
            "messaging_product": "whatsapp",
            "pin": pin
        }
        
        # Add access token to request parameters
        params = {
            "access_token": access_token
        }
        
        # Make the POST request to Facebook Graph API
        response = requests.post(url, json=request_body, params=params)
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            
        return response.json()
        
    except Exception as e:
        return {"error": f"Failed to register phone number: {str(e)}"}

@app.post("/subscribe-webhooks/{waba_id}")
async def subscribe_webhooks(waba_id: str, db: Session = Depends(get_db)):
    try:
        # Try to get business token from database first
        waba_data = db.query(WabaData).filter(WabaData.waba_id == waba_id).first()
        access_token = waba_data.access_token if waba_data else ACCESS_TOKEN
        
        if not access_token:
            return {"error": "No access token available"}
        
        # Facebook Graph API endpoint for subscribing to webhooks
        url = f"https://graph.facebook.com/v18.0/{waba_id}/subscribed_apps"
        
        # Add access token to request parameters
        params = {
            "access_token": access_token
        }
        
        # Make the POST request to Facebook Graph API
        response = requests.post(url, params=params)
        
        # Print response for testing
        print(f"Subscribe webhooks response for WABA {waba_id}:")
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            
        return response.json()
        
    except Exception as e:
        return {"error": f"Failed to subscribe to webhooks: {str(e)}"}

@app.get("/waba-subscriptions/{waba_id}")
async def get_waba_subscriptions(waba_id: str, db: Session = Depends(get_db)):
    try:
        print(f"GET /waba-subscriptions/{waba_id} called")
        
        # Try to get business token from database first
        waba_data = db.query(WabaData).filter(WabaData.waba_id == waba_id).first()
        access_token = waba_data.access_token if waba_data else ACCESS_TOKEN
        
        if not access_token:
            print("No access token available")
            return {"error": "No access token available"}
        
        # Facebook Graph API endpoint for getting WABA subscriptions
        url = f"https://graph.facebook.com/v18.0/{waba_id}/subscribed_apps"
        print(f"Calling Facebook API: {url}")
        
        # Add access token to request parameters
        params = {
            "access_token": access_token
        }
        
        # Make the GET request to Facebook Graph API
        response = requests.get(url, params=params)
        
        print(f"Facebook API response status: {response.status_code}")
        print(f"Facebook API response body: {response.text}")
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
        
        # Parse and print subscription details
        response_data = response.json()
        print(f"\n=== WABA {waba_id} Subscription Details ===")
        if response_data.get('data') and len(response_data['data']) > 0:
            print(f"Number of subscribed apps: {len(response_data['data'])}")
            for i, app in enumerate(response_data['data'], 1):
                app_data = app.get('whatsapp_business_api_data', {})
                print(f"App {i}:")
                print(f"  - ID: {app_data.get('id', 'N/A')}")
                print(f"  - Name: {app_data.get('name', 'N/A')}")
                print(f"  - Link: {app_data.get('link', 'N/A')}")
        else:
            print("No subscribed apps found")
        print("=" * 50)
            
        return response_data
        
    except Exception as e:
        print(f"Exception in get_waba_subscriptions: {str(e)}")
        return {"error": f"Failed to retrieve WABA subscriptions: {str(e)}"}


@app.post("/exchange-code-for-token")
async def exchange_code_for_token(request: WabaRequest, db: Session = Depends(get_db)):
    try:
        if not FACEBOOK_APP_ID or not FACEBOOK_APP_SECRET:
            return {"error": "FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not found in environment variables"}
        
        # Exchange code for access token
        url = "https://graph.facebook.com/v21.0/oauth/access_token"
        params = {
            "client_id": FACEBOOK_APP_ID,
            "client_secret": FACEBOOK_APP_SECRET,
            "code": request.code
        }
        
        print(f"Exchanging code for token with params: {params}")
        response = requests.get(url, params=params)
        
        print(f"Facebook API response status: {response.status_code}")
        print(f"Facebook API response body: {response.text}")
        
        # Check if the response is successful
        if response.status_code == 200:
            try:
                # Parse JSON response from Facebook
                response_data = response.json()
                
                # Extract the access token from the response
                if 'access_token' in response_data:
                    business_token = response_data['access_token']
                else:
                    # Fallback: if response is plain text (some versions might return this)
                    business_token = response.text.strip()
                
                print(f"Successfully extracted business token: {business_token[:20]}...")
                
                # Store WABA data in SQLite database
                waba_data = WabaData(
                    waba_id=request.waba_id,
                    access_token=business_token
                )
                
                # Check if WABA already exists, update if it does, create if it doesn't
                existing_waba = db.query(WabaData).filter(WabaData.waba_id == request.waba_id).first()
                if existing_waba:
                    existing_waba.access_token = business_token
                    existing_waba.updated_at = datetime.utcnow()
                    print(f"Updated existing WABA data: {request.waba_id}")
                else:
                    db.add(waba_data)
                    print(f"Created new WABA data: {request.waba_id}")
                
                db.commit()
                
                return {
                    "success": True,
                    "access_token": business_token,
                    "waba_id": request.waba_id,
                    "message": "Token exchanged successfully"
                }
                
            except ValueError as e:
                # Handle case where response is not valid JSON
                print(f"Response is not valid JSON, treating as plain text: {e}")
                business_token = response.text.strip()
                
                # Store WABA data in SQLite database
                waba_data = WabaData(
                    waba_id=request.waba_id,
                    access_token=business_token
                )
                
                # Check if WABA already exists, update if it does, create if it doesn't
                existing_waba = db.query(WabaData).filter(WabaData.waba_id == request.waba_id).first()
                if existing_waba:
                    existing_waba.access_token = business_token
                    existing_waba.updated_at = datetime.utcnow()
                else:
                    db.add(waba_data)
                
                db.commit()
                
                return {
                    "success": True,
                    "access_token": business_token,
                    "waba_id": request.waba_id,
                    "message": "Token exchanged successfully (plain text response)"
                }
        else:
            error_detail = f"Facebook API error: {response.status_code}"
            try:
                error_data = response.json()
                if 'error' in error_data:
                    error_detail += f" - {error_data['error'].get('message', 'Unknown error')}"
            except:
                error_detail += f" - {response.text}"
            
            return {"error": error_detail, "status_code": response.status_code}
            
    except Exception as e:
        print(f"Exception in exchange_code_for_token: {str(e)}")
        return {"error": f"Failed to exchange code for token: {str(e)}"}

@app.get("/waba-data")
async def get_waba_data(db: Session = Depends(get_db)):
    """Get all stored WABA data"""
    try:
        waba_data = db.query(WabaData).all()
        return {
            "data": [
                {
                    "waba_id": waba.waba_id,
                    "access_token": waba.access_token[:20] + "..." if waba.access_token else None,  # Truncate for security
                    "created_at": waba.created_at.isoformat() if waba.created_at else None,
                    "updated_at": waba.updated_at.isoformat() if waba.updated_at else None
                }
                for waba in waba_data
            ]
        }
    except Exception as e:
        return {"error": f"Failed to retrieve WABA data: {str(e)}"}

@app.get("/waba-data/{waba_id}")
async def get_waba_data_by_id(waba_id: str, db: Session = Depends(get_db)):
    """Get specific WABA data by ID"""
    try:
        waba_data = db.query(WabaData).filter(WabaData.waba_id == waba_id).first()
        if not waba_data:
            return {"error": "WABA not found"}
        
        return {
            "waba_id": waba_data.waba_id,
            "access_token": waba_data.access_token[:20] + "..." if waba_data.access_token else None,  # Truncate for security
            "created_at": waba_data.created_at.isoformat() if waba_data.created_at else None,
            "updated_at": waba_data.updated_at.isoformat() if waba_data.updated_at else None
        }
    except Exception as e:
        return {"error": f"Failed to retrieve WABA data: {str(e)}"}

@app.get("/waba-data/{waba_id}/with-phone-numbers")
async def get_waba_data_with_phone_numbers(waba_id: str, db: Session = Depends(get_db)):
    """Get WABA data with associated phone numbers"""
    try:
        waba_data = db.query(WabaData).filter(WabaData.waba_id == waba_id).first()
        if not waba_data:
            return {"error": "WABA not found"}
        
        # Get phone numbers for this WABA
        phone_numbers = db.query(WabaPhoneNumber).filter(WabaPhoneNumber.waba_id == waba_id).all()
        
        return {
            "waba_id": waba_data.waba_id,
            "access_token": waba_data.access_token[:20] + "..." if waba_data.access_token else None,  # Truncate for security
            "created_at": waba_data.created_at.isoformat() if waba_data.created_at else None,
            "updated_at": waba_data.updated_at.isoformat() if waba_data.updated_at else None,
            "phone_numbers": [
                {
                    "phone_number_id": phone.phone_number_id,
                    "display_phone_number": phone.display_phone_number,
                    "code_verification_status": phone.code_verification_status,
                    "verification_expiry_time": phone.verification_expiry_time,
                    "created_at": phone.created_at.isoformat() if phone.created_at else None,
                    "updated_at": phone.updated_at.isoformat() if phone.updated_at else None
                }
                for phone in phone_numbers
            ]
        }
    except Exception as e:
        return {"error": f"Failed to retrieve WABA data with phone numbers: {str(e)}"}

@app.get("/stored-phone-numbers/{waba_id}")
async def get_stored_phone_numbers(waba_id: str, db: Session = Depends(get_db)):
    """Get stored phone numbers for a specific WABA"""
    try:
        phone_numbers = db.query(WabaPhoneNumber).filter(WabaPhoneNumber.waba_id == waba_id).all()
        
        return {
            "waba_id": waba_id,
            "phone_numbers": [
                {
                    "phone_number_id": phone.phone_number_id,
                    "display_phone_number": phone.display_phone_number,
                    "code_verification_status": phone.code_verification_status,
                    "verification_expiry_time": phone.verification_expiry_time,
                    "created_at": phone.created_at.isoformat() if phone.created_at else None,
                    "updated_at": phone.updated_at.isoformat() if phone.updated_at else None
                }
                for phone in phone_numbers
            ]
        }
    except Exception as e:
        return {"error": f"Failed to retrieve stored phone numbers: {str(e)}"}

@app.get("/all-stored-phone-numbers")
async def get_all_stored_phone_numbers(db: Session = Depends(get_db)):
    """Get all stored phone numbers across all WABAs"""
    try:
        phone_numbers = db.query(WabaPhoneNumber).all()
        
        return {
            "phone_numbers": [
                {
                    "phone_number_id": phone.phone_number_id,
                    "waba_id": phone.waba_id,
                    "display_phone_number": phone.display_phone_number,
                    "code_verification_status": phone.code_verification_status,
                    "verification_expiry_time": phone.verification_expiry_time,
                    "created_at": phone.created_at.isoformat() if phone.created_at else None,
                    "updated_at": phone.updated_at.isoformat() if phone.updated_at else None
                }
                for phone in phone_numbers
            ]
        }
    except Exception as e:
        return {"error": f"Failed to retrieve all stored phone numbers: {str(e)}"}

# not being used
@app.post("/deregister-phone-number/{number_id}")
async def deregister_phone_number(number_id: str):
    try:
        if not ACCESS_TOKEN:
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for deregistering phone number
        url = f"https://graph.facebook.com/v18.0/{number_id}/deregister"
        
        # Add access token to request parameters
        params = {
            "access_token": ACCESS_TOKEN
        }
        
        # Make the POST request to Facebook Graph API
        response = requests.post(url, params=params)
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            
        return response.json()
        
    except Exception as e:
        return {"error": f"Failed to deregister phone number: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=9000,
        reload=True,
        log_level="info"
    )