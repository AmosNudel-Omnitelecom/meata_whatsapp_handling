import { configureStore } from '@reduxjs/toolkit';
import { phoneNumbersApi } from './phoneNumbersApi';

export const store = configureStore({
  reducer: {
    [phoneNumbersApi.reducerPath]: phoneNumbersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(phoneNumbersApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 