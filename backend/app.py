
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
business_portfolio_id = os.getenv("BUSINESS_PORTFOLIO_ID")

app = FastAPI()

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


@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/test")
async def test():
    return {"message": "Backend is running", "status": "ok"}

@app.post("/test-post")
async def test_post(request: PhoneNumberRequest):
    print(f"Test POST received: {request.phone_number}")
    return {"message": "Test POST successful", "phone_number": request.phone_number}

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
async def get_waba_phone_numbers(waba_id: str):
    try:
        if not ACCESS_TOKEN:
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for WABA phone numbers
        url = f"https://graph.facebook.com/v18.0/{waba_id}/phone_numbers"
        
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
            
        data = response.json()
        
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
async def register_phone_number(waba_phone_number_id: str, pin: str):
    try:
        if not ACCESS_TOKEN:
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
            "access_token": ACCESS_TOKEN
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
async def subscribe_webhooks(waba_id: str):
    try:
        if not ACCESS_TOKEN:
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for subscribing to webhooks
        url = f"https://graph.facebook.com/v18.0/{waba_id}/subscribed_apps"
        
        # Add access token to request parameters
        params = {
            "access_token": ACCESS_TOKEN
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
async def get_waba_subscriptions(waba_id: str):
    try:
        print(f"GET /waba-subscriptions/{waba_id} called")
        
        if not ACCESS_TOKEN:
            print("ACCESS_TOKEN not found in environment variables")
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for getting WABA subscriptions
        url = f"https://graph.facebook.com/v18.0/{waba_id}/subscribed_apps"
        print(f"Calling Facebook API: {url}")
        
        # Add access token to request parameters
        params = {
            "access_token": ACCESS_TOKEN
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