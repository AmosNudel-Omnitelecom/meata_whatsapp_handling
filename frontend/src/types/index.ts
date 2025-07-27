// Common API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Phone number related types
export interface PhoneNumber {
  id: string;
  phone_number: string;
  code_verification_status: string;
  verification_expiry_time?: string;
}

export interface PhoneNumbersResponse {
  data: PhoneNumber[];
}

// WABA related types
export interface WABA {
  id: string;
  name?: string;
  currency?: string;
  timezone_id?: string;
  message_template_namespace?: string;
  account_review_status?: string;
  business_verification_status?: string;
  owner_business_info?: {
    business_verification_status?: string;
    display_name?: string;
    id?: string;
    name?: string;
    vertical?: string;
    vertical_id?: string;
  };
  owner?: {
    id?: string;
    name?: string;
  };
}

export interface WABAResponse {
  data: WABA[];
}

export interface WABAPhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name?: string;
  code_verification_status?: string;
  quality_rating?: string;
  platform_type?: string;
  throughput?: {
    level?: string;
  };
  webhook_configuration?: {
    application?: string;
  };
}

export interface WABAPhoneNumbersResponse {
  data: WABAPhoneNumber[];
}

// Error types
export interface ApiError {
  error: string;
  details?: string;
  url?: string;
} 