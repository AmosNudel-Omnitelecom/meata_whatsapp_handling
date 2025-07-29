import React, { useState } from 'react';
import { useGetPhoneNumbersQuery, useDeletePhoneNumberMutation, useRequestVerificationCodeMutation, useVerifyCodeMutation } from '../store/phoneNumbersApi';
import './PhoneNumbers.css';

interface PhoneNumbersProps {
  newlyAddedPhoneId: string | null;
  onPhoneNumberDeleted?: (phoneNumberId: string) => void;
}

const PhoneNumbers: React.FC<PhoneNumbersProps> = ({ 
  newlyAddedPhoneId, 
  onPhoneNumberDeleted
}) => {
  const { data, error, isLoading, refetch } = useGetPhoneNumbersQuery();
  const [deletePhoneNumber] = useDeletePhoneNumberMutation();
  const [requestVerificationCode] = useRequestVerificationCodeMutation();
  const [verifyCode] = useVerifyCodeMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [requestingCodeId, setRequestingCodeId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationCodes, setVerificationCodes] = useState<{ [key: string]: string }>({});
  const [showVerificationInput, setShowVerificationInput] = useState<{ [key: string]: boolean }>({});
  const [searchPhoneNumber, setSearchPhoneNumber] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');
  const [searchedPhoneId, setSearchedPhoneId] = useState<string | null>(null);

  const handleDelete = async (numberId: string) => {
    if (window.confirm('Are you sure you want to delete this phone number?')) {
      setDeletingId(numberId);
      try {
        await deletePhoneNumber(numberId).unwrap();
        // Success - the cache will be automatically invalidated
        
        // Notify parent component about the deletion
        if (onPhoneNumberDeleted) {
          onPhoneNumberDeleted(numberId);
        }
      } catch (error) {
        console.error('Failed to delete phone number:', error);
        alert('Failed to delete phone number. Please try again.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleRequestVerificationCode = async (numberId: string) => {
    setRequestingCodeId(numberId);
    try {
      await requestVerificationCode(numberId).unwrap();
      alert('Verification code has been sent successfully!');
      // Show verification input field for this number
      setShowVerificationInput(prev => ({ ...prev, [numberId]: true }));
    } catch (error) {
      console.error('Failed to request verification code:', error);
      alert('Failed to request verification code. Please try again.');
    } finally {
      setRequestingCodeId(null);
    }
  };

  const handleVerifyCode = async (numberId: string) => {
    const code = verificationCodes[numberId];
    if (!code || code.trim() === '') {
      alert('Please enter a verification code');
      return;
    }

    setVerifyingId(numberId);
    try {
      console.log('Attempting to verify code:', { numberId, code });
      const result = await verifyCode({ numberId, code }).unwrap();
      console.log('Verification result:', result);
      alert('Code verified successfully!');
      // Hide verification input and clear code
      setShowVerificationInput(prev => ({ ...prev, [numberId]: false }));
      setVerificationCodes(prev => ({ ...prev, [numberId]: '' }));
    } catch (error) {
      console.error('Failed to verify code - Error details:', error);
      console.error('Error type:', typeof error);
      console.error('Error structure:', JSON.stringify(error, null, 2));
      
      // Check if it's an RTK Query error
      if (error && typeof error === 'object' && 'status' in error) {
        console.error('RTK Query error status:', (error as any).status);
        console.error('RTK Query error data:', (error as any).data);
      }
      
      alert('Failed to verify code. Please check the code and try again.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleCodeChange = (numberId: string, value: string) => {
    setVerificationCodes(prev => ({ ...prev, [numberId]: value }));
  };

  const handleSearchByPhoneNumber = () => {
    if (!searchPhoneNumber.trim() || !data?.data) return;
    
    const foundPhone = data.data.find(phone => 
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
    if (!searchId.trim() || !data?.data) return;
    
    const foundPhone = data.data.find(phone => 
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

  // Determine which phone ID to display (newly added takes priority, then searched)
  const displayPhoneId = newlyAddedPhoneId || searchedPhoneId;

  if (isLoading) {
    return (
      <div className="phone-numbers-container">
        <h2>Phone Numbers</h2>
        <div className="loading">Loading phone numbers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="phone-numbers-container">
        <h2>Phone Numbers</h2>
        <div className="error">
          Error loading phone numbers: {JSON.stringify(error)}
        </div>
        <button onClick={() => refetch()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="phone-numbers-container">
      <div className="header">
        <h2>Phone Numbers</h2>
        <div className="header-actions">
          <button onClick={() => refetch()} className="refresh-button">
            Refresh
          </button>
        </div>
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
      
      {/* Show phone numbers list */}
      {data?.data ? (
        (() => {
          const phoneNumbersToShow: any[] = [];
          
          // Always add the newly added phone number first (if it exists)
          if (newlyAddedPhoneId) {
            const newlyAddedPhone = data.data.find(p => p.id === newlyAddedPhoneId);
            if (newlyAddedPhone) {
              phoneNumbersToShow.push({ ...newlyAddedPhone, isNewlyAdded: true });
            }
          }
          
          // Add the searched phone number if it's different from the newly added one
          if (searchedPhoneId && searchedPhoneId !== newlyAddedPhoneId) {
            const searchedPhone = data.data.find(p => p.id === searchedPhoneId);
            if (searchedPhone) {
              phoneNumbersToShow.push({ ...searchedPhone, isSearched: true });
            }
          }
          
          if (phoneNumbersToShow.length === 0) {
            return (
              <div className="no-phone-numbers">
                <p>Add a phone number to see it here.</p>
              </div>
            );
          }
          
          return (
            <div className="phone-numbers-list">
              {phoneNumbersToShow.map(phoneNumber => (
                <div key={phoneNumber.id} className="phone-number-card">
                  <div className="phone-number-info">
                    <h3>{phoneNumber.phone_number}</h3>
                    <p className="id">ID: {phoneNumber.id}</p>
                    {phoneNumber.isNewlyAdded && (
                      <p className="newly-added-badge">🆕 Newly Added</p>
                    )}
                    {phoneNumber.isSearched && (
                      <p className="searched-badge">🔍 Searched Result</p>
                    )}
                    <p className="status">
                      Status: <span className={`status-${phoneNumber.code_verification_status.toLowerCase()}`}>
                        {phoneNumber.code_verification_status}
                      </span>
                    </p>
                    {phoneNumber.verification_expiry_time && (
                      <p className="expiry">
                        Expires: {new Date(phoneNumber.verification_expiry_time).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  {phoneNumber.code_verification_status === 'NOT_VERIFIED' && (
                    <div className="verification-input-section">
                      <div className="verification-input-group">
                        <input
                          type="text"
                          placeholder="Enter verification code"
                          value={verificationCodes[phoneNumber.id] || ''}
                          onChange={(e) => handleCodeChange(phoneNumber.id, e.target.value)}
                          className="verification-input"
                          maxLength={6}
                        />
                        <button
                          className="verify-button"
                          onClick={() => handleVerifyCode(phoneNumber.id)}
                          disabled={verifyingId === phoneNumber.id}
                        >
                          {verifyingId === phoneNumber.id ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="phone-number-actions">
                    <button 
                      className="request-code-button"
                      onClick={() => handleRequestVerificationCode(phoneNumber.id)}
                      disabled={requestingCodeId === phoneNumber.id}
                    >
                      {requestingCodeId === phoneNumber.id ? 'Requesting...' : 'Request Code'}
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(phoneNumber.id)}
                      disabled={deletingId === phoneNumber.id}
                    >
                      {deletingId === phoneNumber.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()
      ) : (
        <div className="no-phone-numbers">
          <p>Add a phone number to see it here.</p>
        </div>
      )}
    </div>
  );
};

export default PhoneNumbers; 