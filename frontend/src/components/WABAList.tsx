import React, { useState } from 'react';
import { useGetWABAsQuery, useGetClientWABAsQuery, useGetWABASubscriptionsQuery, useSubscribeWebhooksMutation } from '../store/wabaApi';
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

  // Component to render individual WABA item with subscription status
  const WABAItem: React.FC<{ waba: any }> = ({ waba }) => {
    const { data: subscriptions, isLoading: isLoadingSubscriptions } = useGetWABASubscriptionsQuery(waba.id);
    const [subscribeWebhooks, { isLoading: isSubscribing }] = useSubscribeWebhooksMutation();
    
    const isSubscribed = subscriptions?.data && subscriptions.data.length > 0;
    
    const handleSubscribe = async (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent WABA selection when clicking subscribe button
      try {
        await subscribeWebhooks(waba.id).unwrap();
        // The cache will be automatically invalidated and the subscription status will update
      } catch (error) {
        console.error('Failed to subscribe to webhooks:', error);
        alert('Failed to subscribe to webhooks. Please try again.');
      }
    };
    
    return (
      <div
        className={`waba-item ${selectedWABAId === waba.id ? 'selected' : ''}`}
        onClick={() => handleWABAClick(waba.id)}
      >
        <div className="waba-header">
          <h3>{waba.name || waba.id}</h3>
          <div className="subscription-status">
            {isLoadingSubscriptions ? (
              <span className="status-loading">Checking...</span>
            ) : isSubscribed ? (
              <span className="status-badge subscribed">Subscribed</span>
            ) : (
              <button
                className="status-badge not-subscribed subscribe-button"
                onClick={handleSubscribe}
                disabled={isSubscribing}
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            )}
          </div>
        </div>
        <div className="waba-details">
          <p><strong>ID:</strong> {waba.id}</p>
        </div>
      </div>
    );
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
            <WABAItem key={waba.id} waba={waba} />
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