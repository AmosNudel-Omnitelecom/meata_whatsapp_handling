import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { WABAResponse, WABAPhoneNumbersResponse } from '../types';

export const wabaApi = createApi({
  reducerPath: 'wabaApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:9000/',
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
  useRegisterPhoneNumberMutation
} = wabaApi; 