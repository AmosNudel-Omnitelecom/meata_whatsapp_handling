import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { PhoneNumber, PhoneNumbersResponse } from '../types';

export const phoneNumbersApi = createApi({
  reducerPath: 'phoneNumbersApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:9000/',
  }),
  tagTypes: ['PhoneNumbers'],
  endpoints: (builder) => ({
    getPhoneNumbers: builder.query<PhoneNumbersResponse, void>({
      query: () => 'phone-numbers',
      providesTags: ['PhoneNumbers'],
    }),
    deletePhoneNumber: builder.mutation<void, string>({
      query: (numberId) => ({
        url: `delete-phone-number/${numberId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PhoneNumbers'],
    }),
    requestVerificationCode: builder.mutation<void, string>({
      query: (numberId) => ({
        url: `request-verification-code/${numberId}`,
        method: 'POST',
      }),
      invalidatesTags: ['PhoneNumbers'],
    }),
    verifyCode: builder.mutation<void, { numberId: string; code: string }>({
      query: ({ numberId, code }) => ({
        url: `verify-code/${numberId}`,
        method: 'POST',
        params: { code },
      }),
      invalidatesTags: ['PhoneNumbers'],
    }),
  }),
});

export const { useGetPhoneNumbersQuery, useDeletePhoneNumberMutation, useRequestVerificationCodeMutation, useVerifyCodeMutation } = phoneNumbersApi; 