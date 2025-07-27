import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import TabContainer from './components/TabContainer';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <header className="App-header">
          <h1>WhatsApp Business API Manager</h1>
        </header>
        <main>
          <TabContainer />
        </main>
      </div>
    </Provider>
  );
}

export default App;
