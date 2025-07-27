import React, { useState } from 'react';
import WABAList from './WABAList';
import WABAPhoneNumbers from './WABAPhoneNumbers';
import './WABAManager.css';

const WABAManager: React.FC = () => {
  const [selectedWABAId, setSelectedWABAId] = useState<string | undefined>();

  const handleWABASelect = (wabaId: string) => {
    setSelectedWABAId(wabaId);
  };

  return (
    <div className="waba-manager">
      <div className="waba-manager-header">
        <h1>WhatsApp Business Account Manager</h1>
        <p>Manage your WhatsApp Business Accounts and their phone numbers</p>
      </div>
      
      <div className="waba-manager-content">
        <div className="waba-list-section">
          <WABAList 
            onWABASelect={handleWABASelect}
            selectedWABAId={selectedWABAId}
          />
        </div>
        
        <div className="waba-phone-numbers-section">
          <WABAPhoneNumbers selectedWABAId={selectedWABAId} />
        </div>
      </div>
    </div>
  );
};

export default WABAManager; 