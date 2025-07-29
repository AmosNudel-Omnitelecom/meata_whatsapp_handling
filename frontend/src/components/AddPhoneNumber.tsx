import React, { useState } from 'react';
import { useAddPhoneNumberMutation } from '../store/phoneNumbersApi';
import './AddPhoneNumber.css';

interface AddPhoneNumberProps {
  onPhoneNumberAdded?: (phoneNumberId: string) => void;
}

const AddPhoneNumber: React.FC<AddPhoneNumberProps> = ({ onPhoneNumberAdded }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addPhoneNumber, { isLoading }] = useAddPhoneNumberMutation();
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      alert('Please enter a valid phone number (e.g., +1234567890)');
      return;
    }

    try {
      const result = await addPhoneNumber(phoneNumber.trim()).unwrap();
      alert('Phone number added successfully!');
      setPhoneNumber('');
      setShowForm(false);
      
      // Call the callback with the new phone number ID
      if (onPhoneNumberAdded && result.id) {
        onPhoneNumberAdded(result.id);
      }
    } catch (error) {
      console.error('Failed to add phone number:', error);
      alert('Failed to add phone number. Please try again.');
    }
  };

  const handleCancel = () => {
    setPhoneNumber('');
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <div className="add-phone-number-container">
        <button 
          className="add-phone-button"
          onClick={() => setShowForm(true)}
        >
          + Add Phone Number
        </button>
      </div>
    );
  }

  return (
    <div className="add-phone-number-container">
      <div className="add-phone-form">
        <h3>Add New Phone Number</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number:</label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="phone-input"
              disabled={isLoading}
            />
            <small>Enter phone number in international format (e.g., +1234567890)</small>
          </div>
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Phone Number'}
            </button>
            <button 
              type="button" 
              className="cancel-button"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPhoneNumber;
