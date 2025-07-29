import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { WABAResponse, WABAPhoneNumbersResponse } from '../types';

// Automatically use localhost in development, production URL in production
const getApiUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:9000/';
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:9000/';
};

export const wabaApi = createApi({
  reducerPath: 'wabaApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: getApiUrl(),
  }),
  tagTypes: ['WABAs', 'WABAPhoneNumbers'],
  endpoints: (builder) => ({
    getWABAs: builder.query<WABAResponse, void>({
      query: () => 'wabas',
      providesTags: ['WABAs'],
    }),
    getClientWABAs: builder.query<WABAResponse, void>({
      query: () => 'client-wabas',
      providesTags: ['WABAs'],
    }),
    getWABAPhoneNumbers: builder.query<WABAPhoneNumbersResponse, string>({
      query: (wabaId) => `waba-phone-numbers/${wabaId}`,
      providesTags: (result, error, wabaId) => [{ type: 'WABAPhoneNumbers', id: wabaId }],
    }),
    getWABASubscriptions: builder.query<any, string>({
      query: (wabaId) => `waba-subscriptions/${wabaId}`,
      providesTags: (result, error, wabaId) => [{ type: 'WABAs', id: wabaId }],
    }),
    subscribeWebhooks: builder.mutation<any, string>({
      query: (wabaId) => ({
        url: `subscribe-webhooks/${wabaId}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, wabaId) => [{ type: 'WABAs', id: wabaId }],
    }),
    registerPhoneNumber: builder.mutation<{ success: boolean }, { phoneNumberId: string; pin: string }>({
      query: ({ phoneNumberId, pin }) => ({
        url: `register-phone-number/${phoneNumberId}`,
        method: 'POST',
        body: { pin },
      }),
      invalidatesTags: (result, error, { phoneNumberId }) => [{ type: 'WABAPhoneNumbers', id: phoneNumberId }],
    }),
  }),
});

export const { 
  useGetWABAsQuery, 
  useGetClientWABAsQuery, 
  useGetWABAPhoneNumbersQuery,
  useGetWABASubscriptionsQuery,
  useSubscribeWebhooksMutation,
  useRegisterPhoneNumberMutation
} = wabaApi; 