import { configureStore } from '@reduxjs/toolkit';
import { phoneNumbersApi } from './phoneNumbersApi';
import { wabaApi } from './wabaApi';

export const store = configureStore({
  reducer: {
    [phoneNumbersApi.reducerPath]: phoneNumbersApi.reducer,
    [wabaApi.reducerPath]: wabaApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(phoneNumbersApi.middleware, wabaApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 