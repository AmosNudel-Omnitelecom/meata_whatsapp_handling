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

// Error types
export interface ApiError {
  error: string;
  details?: string;
  url?: string;
} 