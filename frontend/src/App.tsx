import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import PhoneNumbers from './components/PhoneNumbers';
import AddPhoneNumber from './components/AddPhoneNumber';
import FacebookSignup from './components/FacebookSignup';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <header className="App-header">
          <h1>WhatsApp Business API Manager</h1>
        </header>
        <main>
          <FacebookSignup />
          <AddPhoneNumber />
          <PhoneNumbers />
        </main>
      </div>
    </Provider>
  );
}

export default App;
