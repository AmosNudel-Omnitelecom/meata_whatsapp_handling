import React, { useState } from 'react';
import PhoneNumbers from './PhoneNumbers';
import AddPhoneNumber from './AddPhoneNumber';
import FacebookSignup from './FacebookSignup';
import WABAManager from './WABAManager';
import './TabContainer.css';

const TabContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, label: 'Phone Numbers', component: 'phone-numbers' },
    { id: 1, label: 'Embedded Signup', component: 'facebook-signup' },
    { id: 2, label: 'WABA', component: 'waba' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <div className="phone-numbers-tab">
            <AddPhoneNumber />
            <PhoneNumbers />
          </div>
        );
      case 1:
        return <FacebookSignup />;
      case 2:
        return <WABAManager />;
      default:
        return null;
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default TabContainer; 