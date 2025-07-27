import React, { useState } from 'react';
import { useRegisterPhoneNumberMutation } from '../store/wabaApi';
import './RegisterPhoneModal.css';

interface RegisterPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  phoneNumberId: string;
}

const RegisterPhoneModal: React.FC<RegisterPhoneModalProps> = ({
  isOpen,
  onClose,
  phoneNumber,
  phoneNumberId,
}) => {
  const [pin, setPin] = useState('');
  const [registerPhoneNumber, { isLoading, error }] = useRegisterPhoneNumberMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      return;
    }

    try {
      await registerPhoneNumber({ phoneNumberId, pin }).unwrap();
      setPin('');
      onClose();
    } catch (err) {
      // Error is handled by the mutation
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow 6 digits
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setPin(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Register Phone Number</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <p className="phone-number-display">
            Registering: <strong>{phoneNumber}</strong>
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="pin">6-Digit PIN</label>
              <input
                type="text"
                id="pin"
                value={pin}
                onChange={handlePinChange}
                placeholder="Enter 6-digit PIN"
                maxLength={6}
                required
                disabled={isLoading}
              />
              <small>
                If the phone number already has two-step verification enabled, 
                enter the existing 6-digit PIN. Otherwise, this will be the new PIN.
              </small>
            </div>
            
            {error && (
              <div className="error-message">
                Error: {error.toString()}
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                type="button" 
                onClick={onClose}
                disabled={isLoading}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isLoading || pin.length !== 6}
                className="register-button"
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPhoneModal; 