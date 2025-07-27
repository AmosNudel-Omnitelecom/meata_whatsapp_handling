import React, { useState } from 'react';
import { useGetPhoneNumbersQuery, useDeletePhoneNumberMutation, useRequestVerificationCodeMutation, useVerifyCodeMutation } from '../store/phoneNumbersApi';
import './PhoneNumbers.css';

const PhoneNumbers: React.FC = () => {
  const { data, error, isLoading, refetch } = useGetPhoneNumbersQuery();
  const [deletePhoneNumber, { isLoading: isDeleting }] = useDeletePhoneNumberMutation();
  const [requestVerificationCode, { isLoading: isRequestingCode }] = useRequestVerificationCodeMutation();
  const [verifyCode, { isLoading: isVerifying }] = useVerifyCodeMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [requestingCodeId, setRequestingCodeId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationCodes, setVerificationCodes] = useState<{ [key: string]: string }>({});
  const [showVerificationInput, setShowVerificationInput] = useState<{ [key: string]: boolean }>({});

  const handleDelete = async (numberId: string) => {
    if (window.confirm('Are you sure you want to delete this phone number?')) {
      setDeletingId(numberId);
      try {
        await deletePhoneNumber(numberId).unwrap();
        // Success - the cache will be automatically invalidated
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
      await verifyCode({ numberId, code }).unwrap();
      alert('Code verified successfully!');
      // Hide verification input and clear code
      setShowVerificationInput(prev => ({ ...prev, [numberId]: false }));
      setVerificationCodes(prev => ({ ...prev, [numberId]: '' }));
    } catch (error) {
      console.error('Failed to verify code:', error);
      alert('Failed to verify code. Please check the code and try again.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleCodeChange = (numberId: string, value: string) => {
    setVerificationCodes(prev => ({ ...prev, [numberId]: value }));
  };

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
        <button onClick={() => refetch()} className="refresh-button">
          Refresh
        </button>
      </div>
      
      {data?.data && data.data.length > 0 ? (
        <div className="phone-numbers-list">
          {data.data.map((phoneNumber) => (
            <div key={phoneNumber.id} className="phone-number-card">
              <div className="phone-number-info">
                <h3>{phoneNumber.phone_number}</h3>
                <p className="id">ID: {phoneNumber.id}</p>
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
              
              {showVerificationInput[phoneNumber.id] && (
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
      ) : (
        <div className="no-phone-numbers">
          <p>No phone numbers found.</p>
        </div>
      )}
    </div>
  );
};

export default PhoneNumbers; 