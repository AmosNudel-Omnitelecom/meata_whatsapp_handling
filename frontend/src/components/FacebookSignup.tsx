import React, { useEffect, useState, useRef } from 'react';
import { useGetPhoneNumbersQuery } from '../store/phoneNumbersApi';
import './FacebookSignup.css';

interface FacebookSignupProps {
  setupConfig?: any;
}



interface SignupResult {
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string;
  success: boolean;
  message: string;
}

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

const FacebookSignup: React.FC<FacebookSignupProps> = ({
  setupConfig
}) => {
  // Get Facebook credentials from environment variables
  const facebookAppId = process.env.REACT_APP_FACEBOOK_APP_ID;
  const facebookConfigId = process.env.REACT_APP_FACEBOOK_CONFIG_ID;
  
  // Debug: Log environment variables (remove in production)
//   console.log('Facebook App ID:', facebookAppId ? 'Found' : 'Missing');
//   console.log('Facebook Config ID:', facebookConfigId ? 'Found' : 'Missing');
  
  // Feature type for embedded signup (can be customized)
  const featureType = ''; // Leave blank for default flow
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupResult, setSignupResult] = useState<SignupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  
  // Get phone numbers from Redux store
  const { data: phoneNumbersData, isLoading: isLoadingNumbers } = useGetPhoneNumbersQuery();

  useEffect(() => {
    // Load Facebook SDK
    const loadFacebookSDK = () => {
      if (document.querySelector('script[src*="connect.facebook.net"]')) {
        // SDK already loaded
        initializeFacebook();
        return;
      }

      scriptRef.current = document.createElement('script');
      scriptRef.current.src = 'https://connect.facebook.net/en_US/sdk.js';
      scriptRef.current.async = true;
      scriptRef.current.defer = true;
      scriptRef.current.crossOrigin = 'anonymous';
      
      scriptRef.current.onload = () => {
        initializeFacebook();
      };

      scriptRef.current.onerror = () => {
        setError('Failed to load Facebook SDK');
      };

      document.head.appendChild(scriptRef.current);
    };

    // Initialize Facebook SDK
    const initializeFacebook = () => {
      window.fbAsyncInit = function() {
        if (window.FB) {
          window.FB.init({
            appId: facebookAppId,
            autoLogAppEvents: true,
            xfbml: true,
            version: 'v18.0'
          });
          setIsInitialized(true);
        }
      };
    };

    // Set up message listener for embedded signup results
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('facebook.com')) return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('message event: ', data); // remove after testing
          
          // Handle successful flow completion
          if (data.event === 'FINISH' || data.event === 'FINISH_ONLY_WABA' || data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
            const result: SignupResult = {
              waba_id: data.data?.waba_id,
              phone_number_id: data.data?.phone_number_id,
              business_id: data.data?.business_id,
              success: true,
              message: `Embedded Signup completed! WABA ID: ${data.data?.waba_id}, Phone ID: ${data.data?.phone_number_id}, Business ID: ${data.data?.business_id}`
            };
            
            setSignupResult(result);
            setIsLoading(false);
            showMessage('success', result.message);
          }
          // Handle abandoned flow
          else if (data.event === 'CANCEL') {
            if (data.data?.current_step) {
              setError(`Flow abandoned at step: ${data.data.current_step}`);
            } else if (data.data?.error_message) {
              setError(`Error: ${data.data.error_message} (Error ID: ${data.data.error_id})`);
            } else {
              setError('Flow was cancelled by user');
            }
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.log('message event: ', event.data); // remove after testing
      }
    };

    // Initialize everything
    loadFacebookSDK();
    window.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
    };
  }, [facebookAppId]);

  const fbLoginCallback = (response: any) => {
    if (response.authResponse) {
      const code = response.authResponse.code;
      console.log('response: ', code); // remove after testing
      // TODO: Send this code to your server to exchange for business token
      console.log('Exchange this code for business token:', code);
    } else {
      console.log('response: ', response); // remove after testing
      setError('Facebook login failed or was cancelled');
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', message: string) => {
    // You can implement a toast notification system here
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const handleStartSignup = () => {
    if (!isInitialized) {
      setError('Facebook SDK not initialized yet');
      return;
    }

    if (!facebookAppId) {
      setError('Facebook App ID not found in environment variables');
      return;
    }

    if (!facebookConfigId) {
      setError('Facebook Config ID not found in environment variables');
      return;
    }

    if (selectedNumbers.length === 0) {
      setError('Please select at least one verified phone number for the signup');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSignupResult(null);

    const setupConfig = {
      features: ['whatsapp_business_management', 'whatsapp_business_messaging'],
      sessionInfoVersion: 3,
      preVerifiedPhone: {
        ids: selectedNumbers
      }
    };

    try {
      window.FB.login(fbLoginCallback, {
        config_id: facebookConfigId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: setupConfig,
          featureType: featureType,
          sessionInfoVersion: '3'
        }
      });
    } catch (err) {
      setError('Failed to start Facebook login');
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSignupResult(null);
    setError(null);
    setIsLoading(false);
    setSelectedNumbers([]);
  };

  const addNumberToSignup = (numberId: string) => {
    if (!selectedNumbers.includes(numberId)) {
      setSelectedNumbers(prev => [...prev, numberId]);
    }
  };

  const removeNumberFromSignup = (numberId: string) => {
    setSelectedNumbers(prev => prev.filter(id => id !== numberId));
  };



  return (
    <div className="facebook-signup-container">
      <div className="facebook-signup-card">
        <h2>Facebook Embedded Signup</h2>
        
        <div className="status-section">
          <div className="status-item">
            <span className="status-label">SDK Status:</span>
            <span className={`status-value ${isInitialized ? 'success' : 'pending'}`}>
              {isInitialized ? 'Initialized' : 'Initializing...'}
            </span>
          </div>
          
          <div className="status-item">
            <span className="status-label">App ID:</span>
            <span className={`status-value ${facebookAppId ? 'success' : 'error'}`}>
              {facebookAppId ? 'Configured' : 'Missing'}
            </span>
          </div>
          
          <div className="status-item">
            <span className="status-label">Config ID:</span>
            <span className={`status-value ${facebookConfigId ? 'success' : 'error'}`}>
              {facebookConfigId ? 'Configured' : 'Missing'}
            </span>
          </div>
        </div>



        {/* Phone Number Selection */}
        <div className="phone-selection-section">
          <h3>Select Phone Numbers for Embedded Signup</h3>
          
          <div className="info-box">
            <p>
              <span className="info-icon">ℹ️</span>
              Only verified phone numbers can be included in the embedded signup flow. Click "Add to Signup" to include numbers in your configuration.
            </p>
          </div>
          
          {isLoadingNumbers ? (
            <div className="loading-message">Loading phone numbers...</div>
          ) : (
            <div className="phone-numbers-list">
              <h4>Available Verified Numbers:</h4>
              {phoneNumbersData?.data?.filter(n => n.code_verification_status === 'VERIFIED').map(number => (
                <div key={number.id} className="phone-number-item">
                  <div className="phone-info">
                    <span className="phone-number">{number.phone_number}</span>
                    <div className="phone-id">ID: {number.id}</div>
                  </div>
                  <div className="phone-actions">
                    <span className="status-badge verified">
                      <span className="status-icon">✓</span>Verified
                    </span>
                    {selectedNumbers.includes(number.id) ? (
                      <button
                        onClick={() => removeNumberFromSignup(number.id)}
                        className="remove-button"
                      >
                        <span className="button-icon">−</span>Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => addNumberToSignup(number.id)}
                        className="add-button"
                      >
                        <span className="button-icon">+</span>Add to Signup
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {phoneNumbersData?.data?.filter(n => n.code_verification_status === 'VERIFIED').length === 0 && (
                <p className="no-numbers">No verified numbers available</p>
              )}
            </div>
          )}
          
          {selectedNumbers.length > 0 && (
            <div className="selected-numbers">
              <h4>
                <span className="check-icon">✓</span>
                Selected Numbers for Signup ({selectedNumbers.length})
              </h4>
              <div className="selected-list">
                {selectedNumbers.map(numberId => {
                  const number = phoneNumbersData?.data?.find(n => n.id === numberId);
                  return number ? (
                    <div key={numberId} className="selected-item">
                      • {number.phone_number} (ID: {numberId})
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Launch Section */}
        <div className="launch-section">
          <h3>Launch Embedded Signup</h3>
          
          {selectedNumbers.length > 0 ? (
            <>
              <div className="ready-message">
                <span className="ready-icon">✓</span>
                Ready to test with {selectedNumbers.length} verified number{selectedNumbers.length > 1 ? 's' : ''}
              </div>
              
              <div className="config-display">
                <h4>Configuration Settings</h4>
                <div className="config-grid">
                  <div className="config-item">
                    <label>App ID</label>
                    <div className="config-value">
                      {facebookAppId ? (
                        <span className="success">
                          <span className="check-icon">✓</span>
                          {facebookAppId}
                        </span>
                      ) : (
                        <span className="loading">
                          <span className="spinner">⟳</span>
                          Loading from environment...
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="config-item">
                    <label>Configuration ID</label>
                    <div className="config-value">
                      {facebookConfigId ? (
                        <span className="success">
                          <span className="check-icon">✓</span>
                          {facebookConfigId}
                        </span>
                      ) : (
                        <span className="loading">
                          <span className="spinner">⟳</span>
                          Loading from environment...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ready-status">
                <span className="ready-icon">✓</span>
                <strong>Ready:</strong> App ID and Configuration ID loaded from environment variables. Click "Launch Embedded Signup" to test the flow.
              </div>

              <div className="launch-actions">
                <button
                  className="launch-button"
                  onClick={handleStartSignup}
                  disabled={!facebookAppId || !facebookConfigId || selectedNumbers.length === 0 || isLoading}
                >
                  <span className="facebook-icon">📘</span>
                  Launch Embedded Signup
                  {!facebookAppId || !facebookConfigId ? ' (Loading...)' : ''}
                </button>
                
                {(signupResult || error) && (
                  <button
                    className="reset-button"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="config-preview">
                <h4>Generated Configuration</h4>
                <div className="config-code">
                  <pre>{JSON.stringify({
                    setup: {
                      features: ['whatsapp_business_management', 'whatsapp_business_messaging'],
                      sessionInfoVersion: 3,
                      preVerifiedPhone: { ids: selectedNumbers }
                    }
                  }, null, 2)}</pre>
                </div>
              </div>
            </>
          ) : (
            <div className="warning-message">
              <span className="warning-icon">⚠️</span>
              No numbers selected for embedded signup. Add verified numbers above to test the flow.
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {signupResult && (
          <div className="success-message">
            <h3>Signup Successful!</h3>
            <div className="result-details">
              {signupResult.waba_id && (
                <div className="result-item">
                  <strong>WABA ID:</strong> {signupResult.waba_id}
                </div>
              )}
              {signupResult.phone_number_id && (
                <div className="result-item">
                  <strong>Phone Number ID:</strong> {signupResult.phone_number_id}
                </div>
              )}
              {signupResult.business_id && (
                <div className="result-item">
                  <strong>Business ID:</strong> {signupResult.business_id}
                </div>
              )}
            </div>
            <p>{signupResult.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacebookSignup;