import React, { useState } from 'react';
import { useGetWABAsQuery, useGetClientWABAsQuery } from '../store/wabaApi';
import './WABAList.css';

interface WABAListProps {
  onWABASelect: (wabaId: string) => void;
  selectedWABAId?: string;
}

const WABAList: React.FC<WABAListProps> = ({ onWABASelect, selectedWABAId }) => {
  const [activeTab, setActiveTab] = useState<'owned' | 'client'>('owned');
  
  const { data: ownedWABAs, isLoading: isLoadingOwned, error: ownedError } = useGetWABAsQuery();
  const { data: clientWABAs, isLoading: isLoadingClient, error: clientError } = useGetClientWABAsQuery();

  const isLoading = activeTab === 'owned' ? isLoadingOwned : isLoadingClient;
  const error = activeTab === 'owned' ? ownedError : clientError;
  const wabas = activeTab === 'owned' ? ownedWABAs?.data : clientWABAs?.data;

  const handleWABAClick = (wabaId: string) => {
    onWABASelect(wabaId);
  };

  if (isLoading) {
    return (
      <div className="waba-list-container">
        <div className="waba-list-header">
          <h2>WhatsApp Business Accounts</h2>
          <div className="waba-tabs">
            <button 
              className={`tab ${activeTab === 'owned' ? 'active' : ''}`}
              onClick={() => setActiveTab('owned')}
              disabled={isLoading}
            >
              Owned WABAs {isLoadingOwned && '(Loading...)'}
            </button>
            <button 
              className={`tab ${activeTab === 'client' ? 'active' : ''}`}
              onClick={() => setActiveTab('client')}
              disabled={isLoading}
            >
              Client WABAs {isLoadingClient && '(Loading...)'}
            </button>
          </div>
        </div>
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading {activeTab === 'owned' ? 'owned' : 'client'} WABAs...</p>
          <p className="loading-details">Fetching data from WhatsApp Business API</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="waba-list-container">
        <div className="waba-list-header">
          <h2>WhatsApp Business Accounts</h2>
          <div className="waba-tabs">
            <button 
              className={`tab ${activeTab === 'owned' ? 'active' : ''}`}
              onClick={() => setActiveTab('owned')}
            >
              Owned WABAs
            </button>
            <button 
              className={`tab ${activeTab === 'client' ? 'active' : ''}`}
              onClick={() => setActiveTab('client')}
            >
              Client WABAs
            </button>
          </div>
        </div>
        <div className="error">
          Error loading WABAs: {error.toString()}
        </div>
      </div>
    );
  }

  return (
    <div className="waba-list-container">
      <div className="waba-list-header">
        <h2>WhatsApp Business Accounts</h2>
        <div className="waba-tabs">
                      <button 
              className={`tab ${activeTab === 'owned' ? 'active' : ''}`}
              onClick={() => setActiveTab('owned')}
              disabled={isLoadingOwned}
            >
              Owned WABAs ({ownedWABAs?.data?.length || 0}) {isLoadingOwned && '(Loading...)'}
            </button>
            <button 
              className={`tab ${activeTab === 'client' ? 'active' : ''}`}
              onClick={() => setActiveTab('client')}
              disabled={isLoadingClient}
            >
              Client WABAs ({clientWABAs?.data?.length || 0}) {isLoadingClient && '(Loading...)'}
            </button>
        </div>
      </div>
      
      <div className="waba-list">
        {wabas && wabas.length > 0 ? (
          wabas.map((waba) => (
            <div
              key={waba.id}
              className={`waba-item ${selectedWABAId === waba.id ? 'selected' : ''}`}
              onClick={() => handleWABAClick(waba.id)}
            >
              <div className="waba-header">
                <h3>{waba.name || waba.id}</h3>
              </div>
              <div className="waba-details">
                <p><strong>ID:</strong> {waba.id}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="no-wabas">
            No {activeTab} WABAs found.
          </div>
        )}
      </div>
    </div>
  );
};

export default WABAList; 