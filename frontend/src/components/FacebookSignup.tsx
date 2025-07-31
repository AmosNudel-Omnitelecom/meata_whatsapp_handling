import React, { useEffect, useState, useRef } from 'react';
import { useGetPhoneNumbersQuery } from '../store/phoneNumbersApi';
import './FacebookSignup.css';

interface FacebookSignupProps {
  newlyAddedPhoneId?: string | null;
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
  newlyAddedPhoneId
}) => {
  // Get Facebook credentials from environment variables
  const facebookAppId = process.env.REACT_APP_FACEBOOK_APP_ID;
  const facebookConfigId = process.env.REACT_APP_FACEBOOK_CONFIG_ID;
  

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupResult, setSignupResult] = useState<SignupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [authCode, setAuthCode] = useState<string | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  
  // Search functionality
  const [searchPhoneNumber, setSearchPhoneNumber] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');
  const [searchedPhoneId, setSearchedPhoneId] = useState<string | null>(null);
  const [showAllNumbers, setShowAllNumbers] = useState<boolean>(false);
  
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
            version: 'v23.0'
          });
          setIsInitialized(true);
        }
      };
    };

    // Set up message listener for embedded signup results
    const handleMessage = async (event: MessageEvent) => {
      if (!event.origin.endsWith('facebook.com')) return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          
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
            
            // Exchange the authorization code for a business token
            if (authCode && data.data?.waba_id) {
              
              try {
                const tokenResponse = await fetch('/exchange-code-for-token', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ 
                    code: authCode,
                    waba_id: data.data.waba_id
                  }),
                });
                
                const tokenData = await tokenResponse.json();
                
                if (tokenData.error) {
                  setError(`Token exchange failed: ${tokenData.error}`);
                } else {
                  
                  
                  showMessage('success', `Business token exchanged successfully for WABA: ${data.data.waba_id}`);
                  
                }
              } catch (error) {
                setError('Failed to exchange authorization code for business token');
              }
            } else {
              // Cannot exchange token: missing auth code or waba_id
            }
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
        // Error handling message
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
  }, [facebookAppId, authCode]);

  const fbLoginCallback = (response: any) => {
    if (response.authResponse) {
      const code = response.authResponse.code;
      // Store the code for later use after embedded signup completes
      setAuthCode(code);
      
    } else {
      const errorDetails = response.error || response.errorMessage || response.error_description || 'Unknown error';
      setError(`Facebook login failed: ${errorDetails}`);
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', message: string) => {
    // You can implement a toast notification system here
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

    try {
      // Reinitialize FB with current appId
      window.FB.init({
        appId: facebookAppId,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v23.0'
      });
      
      
      window.FB.login(fbLoginCallback, {
        config_id: facebookConfigId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          feature: 'whatsapp_embedded_signup',
          setup: {
            preVerifiedPhone: {
              ids: selectedNumbers.map(id => parseInt(id.trim())).filter(id => !isNaN(id))
            }
          },
          featureType: '',
          sessionInfoVersion: '3',
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to start Facebook login: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSignupResult(null);
    setError(null);
    setIsLoading(false);
    setSelectedNumbers([]);
    setAuthCode(null);
  };

  const addNumberToSignup = (numberId: string) => {
    // Only allow one number to be selected at a time
    setSelectedNumbers([numberId]);
  };

  const removeNumberFromSignup = (numberId: string) => {
    // Clear all selected numbers (since only one can be selected)
    setSelectedNumbers([]);
  };

  // Search functionality
  const handleSearchByPhoneNumber = () => {
    if (!searchPhoneNumber.trim() || !phoneNumbersData?.data) return;
    
    const foundPhone = phoneNumbersData.data.find(phone => 
      phone.phone_number.includes(searchPhoneNumber.trim())
    );
    
    if (foundPhone) {
      setSearchedPhoneId(foundPhone.id);
      setSearchId(''); // Clear ID search
    } else {
      alert('Phone number not found');
    }
  };

  const handleSearchById = () => {
    if (!searchId.trim() || !phoneNumbersData?.data) return;
    
    const foundPhone = phoneNumbersData.data.find(phone => 
      phone.id === searchId.trim()
    );
    
    if (foundPhone) {
      setSearchedPhoneId(foundPhone.id);
      setSearchPhoneNumber(''); // Clear phone number search
    } else {
      alert('Phone number ID not found');
    }
  };

  const handleClearSearch = () => {
    setSearchedPhoneId(null);
    setSearchPhoneNumber('');
    setSearchId('');
  };

  // Determine which phone ID to display (newly created takes priority, then searched)
  const displayPhoneId = newlyAddedPhoneId || searchedPhoneId;

  // Function to handle showing all numbers (doesn't clear localStorage)
  const handleShowAllNumbers = () => {
    setShowAllNumbers(true);
  };

  // Function to return to showing the stored phone number
  const handleShowStoredNumber = () => {
    setShowAllNumbers(false);
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
          <div className="section-header">
            <h3>Select Phone Numbers for Embedded Signup</h3>
            {!showAllNumbers && (
              <button 
                onClick={handleShowAllNumbers} 
                className="clear-stored-button"
                title="Show all verified numbers"
              >
                Show All Numbers
              </button>
            )}
            {showAllNumbers && (
              <button 
                onClick={handleShowStoredNumber} 
                className="clear-stored-button"
                title="Show stored phone number"
              >
                Show Stored Number
              </button>
            )}
          </div>
          
                     <div className="info-box">
             <p>
               <span className="info-icon">ℹ️</span>
               Select one verified phone number to pre-fill in the embedded signup flow. Only one number can be selected at a time.
             </p>
           </div>

          {/* Search Section */}
          <div className="search-section">
            <div className="search-row">
              <div className="search-group">
                <input
                  type="text"
                  placeholder="Search by phone number..."
                  value={searchPhoneNumber}
                  onChange={(e) => setSearchPhoneNumber(e.target.value)}
                  className="search-input"
                />
                <button 
                  onClick={handleSearchByPhoneNumber}
                  className="search-button"
                  disabled={!searchPhoneNumber.trim()}
                >
                  Search
                </button>
              </div>
              
              <div className="search-group">
                <input
                  type="text"
                  placeholder="Search by ID..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="search-input"
                />
                <button 
                  onClick={handleSearchById}
                  className="search-button"
                  disabled={!searchId.trim()}
                >
                  Search
                </button>
              </div>
              
              {(searchedPhoneId || searchPhoneNumber || searchId) && (
                <button 
                  onClick={handleClearSearch}
                  className="clear-search-button"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
          
          {isLoadingNumbers ? (
            <div className="loading-message">Loading phone numbers...</div>
          ) : (
            <div className="phone-numbers-list">
              <h4>Available Verified Numbers:</h4>
              
              {/* Show only the specific phone number if one is selected and not showing all numbers */}
              {!showAllNumbers && displayPhoneId && phoneNumbersData?.data ? (
                (() => {
                  const phoneNumber = phoneNumbersData.data.find(p => p.id === displayPhoneId);
                  if (!phoneNumber) {
                    return <p className="no-numbers">Phone number not found.</p>;
                  }
                  
                  if (phoneNumber.code_verification_status !== 'VERIFIED') {
                    return <p className="no-numbers">Selected phone number is not verified.</p>;
                  }
                  
                  return (
                    <div key={phoneNumber.id} className="phone-number-item">
                      <div className="phone-info">
                        <span className="phone-number">{phoneNumber.phone_number}</span>
                        <div className="phone-id">ID: {phoneNumber.id}</div>
                      </div>
                      <div className="phone-actions">
                        <span className="status-badge verified">
                          <span className="status-icon">✓</span>Verified
                        </span>
                                                 {selectedNumbers.includes(phoneNumber.id) ? (
                           <button
                             onClick={() => removeNumberFromSignup(phoneNumber.id)}
                             className="remove-button"
                           >
                             <span className="button-icon">−</span>Remove
                           </button>
                         ) : (
                           <button
                             onClick={() => addNumberToSignup(phoneNumber.id)}
                             className="add-button"
                           >
                             <span className="button-icon">✓</span>Select
                           </button>
                         )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                // Show all verified numbers only when showAllNumbers is explicitly true
                <>
                  {showAllNumbers && phoneNumbersData?.data?.filter(n => n.code_verification_status === 'VERIFIED').map(number => (
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
                  
                  {showAllNumbers && phoneNumbersData?.data?.filter(n => n.code_verification_status === 'VERIFIED').length === 0 && (
                    <p className="no-numbers">No verified numbers available. Add and verify a phone number in the Phone Numbers tab first.</p>
                  )}
                  
                  {!showAllNumbers && (
                    <p className="no-numbers">Click "Show All Numbers" to see available verified phone numbers, or use the search above to find a specific number.</p>
                  )}
                </>
              )}
            </div>
          )}
          
                     {selectedNumbers.length > 0 && (
             <div className="selected-numbers">
               <h4>
                 <span className="check-icon">✓</span>
                 Selected Phone Number for Signup
               </h4>
               <div className="selected-list">
                 {(() => {
                   const number = phoneNumbersData?.data?.find(n => n.id === selectedNumbers[0]);
                   return number ? (
                     <div className="selected-item">
                       • {number.phone_number} (ID: {selectedNumbers[0]})
                     </div>
                   ) : null;
                 })()}
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
                 Ready to test with selected phone number
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
                    config_id: facebookConfigId,
                    response_type: 'code',
                    override_default_response_type: true,
                    extras: {
                      feature: 'whatsapp_embedded_signup',
                      setup: {
                        preVerifiedPhone: {
                          ids: selectedNumbers.map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                        }
                      },
                      featureType: '',
                      sessionInfoVersion: '3',
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
            
            {authCode && (
              <div className="token-exchange-status">
                <h4>Token Exchange Status</h4>
                <div className="status-item">
                  <span className="status-label">Authorization Code:</span>
                  <span className="status-value success">
                    <span className="check-icon">✓</span>
                    Received
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Business Token:</span>
                  <span className="status-value success">
                    <span className="check-icon">✓</span>
                    Exchanged and Stored
                  </span>
                </div>
                <p className="info-text">
                  The business token has been successfully exchanged and stored in the database for WABA ID: {signupResult.waba_id}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacebookSignup;