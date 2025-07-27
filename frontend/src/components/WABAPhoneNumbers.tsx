import React, { useState } from 'react';
import { useGetWABAPhoneNumbersQuery } from '../store/wabaApi';
import RegisterPhoneModal from './RegisterPhoneModal';
import './WABAPhoneNumbers.css';

interface WABAPhoneNumbersProps {
  selectedWABAId?: string;
}

const WABAPhoneNumbers: React.FC<WABAPhoneNumbersProps> = ({ selectedWABAId }) => {
  const [registerModal, setRegisterModal] = useState<{
    isOpen: boolean;
    phoneNumber: string;
    phoneNumberId: string;
  }>({
    isOpen: false,
    phoneNumber: '',
    phoneNumberId: '',
  });

  const { data: phoneNumbers, isLoading, error } = useGetWABAPhoneNumbersQuery(
    selectedWABAId || '',
    { skip: !selectedWABAId }
  );

  const getVerificationStatusColor = (status?: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'status-verified';
      case 'PENDING':
        return 'status-pending';
      case 'NOT_VERIFIED':
        return 'status-not-verified';
      default:
        return 'status-unknown';
    }
  };





  const handleRegisterClick = (phoneNumber: string, phoneNumberId: string) => {
    setRegisterModal({
      isOpen: true,
      phoneNumber,
      phoneNumberId,
    });
  };

  const closeRegisterModal = () => {
    setRegisterModal({
      isOpen: false,
      phoneNumber: '',
      phoneNumberId: '',
    });
  };

  if (!selectedWABAId) {
    return (
      <div className="waba-phone-numbers-container">
        <div className="waba-phone-numbers-header">
          <h2>WABA Phone Numbers</h2>
        </div>
        <div className="no-selection">
          Please select a WABA to view its phone numbers.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="waba-phone-numbers-container">
        <div className="waba-phone-numbers-header">
          <h2>WABA Phone Numbers</h2>
          <p className="waba-id">WABA ID: {selectedWABAId}</p>
        </div>
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading phone numbers...</p>
          <p className="loading-details">Fetching phone numbers from WhatsApp Business API</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="waba-phone-numbers-container">
        <div className="waba-phone-numbers-header">
          <h2>WABA Phone Numbers</h2>
          <p className="waba-id">WABA ID: {selectedWABAId}</p>
        </div>
        <div className="error">
          Error loading phone numbers: {error.toString()}
        </div>
      </div>
    );
  }

  return (
    <div className="waba-phone-numbers-container">
      <div className="waba-phone-numbers-header">
        <h2>WABA Phone Numbers</h2>
        <p className="waba-id">WABA ID: {selectedWABAId}</p>
        <p className="phone-count">
          {phoneNumbers?.data?.length || 0} phone number(s) found
        </p>
      </div>
      
      <div className="phone-numbers-list">
        {phoneNumbers?.data && phoneNumbers.data.length > 0 ? (
          phoneNumbers.data.map((phone) => (
            <div key={phone.id} className="phone-number-item">
                              <div className="phone-header">
                  <h3>{phone.display_phone_number}</h3>
                  <div className="phone-status">
                    <span className={`status verification ${getVerificationStatusColor(phone.code_verification_status)}`}>
                      {phone.code_verification_status || 'UNKNOWN'}
                    </span>
                  </div>
                </div>
              <div className="phone-details">
                <p><strong>ID:</strong> {phone.id}</p>
                <div className="phone-actions">
                  {phone.code_verification_status === 'VERIFIED' && (
                    <button
                      className="register-button"
                      onClick={() => handleRegisterClick(phone.display_phone_number, phone.id)}
                    >
                      Register Phone Number
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-phones">
            No phone numbers found for this WABA.
          </div>
        )}
      </div>
      
      <RegisterPhoneModal
        isOpen={registerModal.isOpen}
        onClose={closeRegisterModal}
        phoneNumber={registerModal.phoneNumber}
        phoneNumberId={registerModal.phoneNumberId}
      />
    </div>
  );
};

export default WABAPhoneNumbers; 