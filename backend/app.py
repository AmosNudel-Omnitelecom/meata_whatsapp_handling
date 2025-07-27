
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
        print(url)
        
        
        if not ACCESS_TOKEN:
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Add access token and fields to request parameters
        params = {
            "access_token": ACCESS_TOKEN,
            "fields": "id,phone_number,code_verification_status,verification_expiry_time"
        }
        print(params)
        
        # Make the request to Facebook Graph API
        response = requests.get(url, params=params)
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")
        
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
        print(f"📱 Getting owned WABAs for business portfolio: {business_portfolio_id}")
        print(f"URL: {url}")
        
        # Add access token to request parameters
        params = {
            "access_token": ACCESS_TOKEN
        }
        
        print(f"Request params: {params}")
        
        # Make the request to Facebook Graph API
        response = requests.get(url, params=params)
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            
        owned_data = response.json()
        print(f"📱 Owned WABAs response: {owned_data}")
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
        print(f"📱 Getting client WABAs for business portfolio: {business_portfolio_id}")
        print(f"URL: {url}")
        
        # Add access token and filtering to request parameters
        params = {
            "access_token": ACCESS_TOKEN,
            "filtering": f'[{{"field":"partners","operator":"ALL","value":["{business_portfolio_id}"]}}]'
        }
        
        print(f"Request params: {params}")
        
        # Make the request to Facebook Graph API
        response = requests.get(url, params=params)
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            
        client_data = response.json()
        print(f"📱 Client WABAs response: {client_data}")
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
        print(f"📱 Getting phone numbers for WABA: {waba_id}")
        print(f"URL: {url}")
        
        # Add access token to request parameters
        params = {
            "access_token": ACCESS_TOKEN
        }
        
        print(f"Request params: {params}")
        
        # Make the request to Facebook Graph API
        response = requests.get(url, params=params)
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            
        data = response.json()
        print(f"📱 WABA phone numbers response: {data}")
        return data
        
    except Exception as e:
        return {"error": f"Failed to retrieve WABA phone numbers: {str(e)}"}

@app.post("/add-phone-number")
async def add_phone_number(phone_number: str):
    try:
        # Use business portfolio ID from environment variables
        if not business_portfolio_id:
            return {"error": "BUSINESS_PORTFOLIO_ID not found in environment variables"}
            
        if not ACCESS_TOKEN:
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for adding phone numbers
        url = f"https://graph.facebook.com/v18.0/{business_portfolio_id}/add_phone_numbers"
        print(f"Adding phone number: {phone_number}")
        print(f"URL: {url}")
        
        # Prepare the request data
        data = {
            "phone_number": phone_number
        }
        
        # Add access token to request parameters
        params = {
            "access_token": ACCESS_TOKEN
        }
        
        print(f"Request data: {data}")
        print(f"Request params: {params}")
        
        # Make the POST request to Facebook Graph API
        response = requests.post(url, json=data, params=params)
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            
        return response.json()
        
    except Exception as e:
        return {"error": f"Failed to add phone number: {str(e)}"}

@app.delete("/delete-phone-number/{number_id}")
async def delete_phone_number(number_id: str):
    try:
        if not ACCESS_TOKEN:
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for deleting phone numbers
        url = f"https://graph.facebook.com/v18.0/{number_id}"
        print(f"Deleting phone number with ID: {number_id}")
        print(f"URL: {url}")
        
        # Add access token to request parameters
        params = {
            "access_token": ACCESS_TOKEN
        }
        
        print(f"Request params: {params}")
        
        # Make the DELETE request to Facebook Graph API
        response = requests.delete(url, params=params)
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")
        
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
        if not ACCESS_TOKEN:
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for requesting verification code
        url = f"https://graph.facebook.com/v18.0/{number_id}/request_code"
        print(f"🔐 Requesting verification code for number ID: {number_id}")
        print(f"URL: {url}")
        
        # Add access token and required parameters
        params = {
            "access_token": ACCESS_TOKEN,
            "code_method": "SMS",
            "language": "en_US"
        }
        
        print(f"Request params: {params}")
        
        # Make the POST request to Facebook Graph API
        response = requests.post(url, params=params)
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            
        return response.json()
        
    except Exception as e:
        return {"error": f"Failed to request verification code: {str(e)}"}

@app.post("/verify-code/{number_id}")
async def verify_code(number_id: str, code: str):
    try:
        if not ACCESS_TOKEN:
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for verifying code
        url = f"https://graph.facebook.com/v18.0/{number_id}/verify_code"
        print(f"🔐 Verifying code for number ID: {number_id}")
        print(f"🔐 Code being verified: {code}")
        print(f"URL: {url}")
        
        # Add access token and verification code
        params = {
            "access_token": ACCESS_TOKEN,
            "code": code
        }
        
        print(f"Request params: {params}")
        
        # Make the POST request to Facebook Graph API
        response = requests.post(url, params=params)
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            
        return response.json()
        
    except Exception as e:
        return {"error": f"Failed to verify code: {str(e)}"}

@app.post("/register-phone-number/{waba_phone_number_id}")
async def register_phone_number(waba_phone_number_id: str, pin: str):
    try:
        if not ACCESS_TOKEN:
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for registering phone number
        url = f"https://graph.facebook.com/v18.0/{waba_phone_number_id}/register"
        print(f"📤 Registering phone number with ID: {waba_phone_number_id}")
        print(f"URL: {url}")
        
        # Prepare the request body
        request_body = {
            "messaging_product": "whatsapp",
            "pin": pin
        }
        print(f"📤 Registration request body: {request_body}")
        
        # Add access token to request parameters
        params = {
            "access_token": ACCESS_TOKEN
        }
        
        print(f"Request params: {params}")
        
        # Make the POST request to Facebook Graph API
        response = requests.post(url, json=request_body, params=params)
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")
        
        if response.status_code != 200:
            return {
                "error": f"Facebook API error: {response.status_code}",
                "details": response.text,
                "url": url
            }
            
        return response.json()
        
    except Exception as e:
        return {"error": f"Failed to register phone number: {str(e)}"}

@app.post("/deregister-phone-number/{number_id}")
async def deregister_phone_number(number_id: str):
    try:
        if not ACCESS_TOKEN:
            return {"error": "ACCESS_TOKEN not found in environment variables"}
        
        # Facebook Graph API endpoint for deregistering phone number
        url = f"https://graph.facebook.com/v18.0/{number_id}/deregister"
        print(f"Deregistering phone number with ID: {number_id}")
        print(f"URL: {url}")
        
        # Add access token to request parameters
        params = {
            "access_token": ACCESS_TOKEN
        }
        
        print(f"Request params: {params}")
        
        # Make the POST request to Facebook Graph API
        response = requests.post(url, params=params)
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")
        
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