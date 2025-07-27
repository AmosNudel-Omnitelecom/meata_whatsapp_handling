# WhatsApp Business API Frontend

This is a React frontend application that integrates with the WhatsApp Business API backend using Redux Toolkit and RTK Query.

## Features

- **Phone Numbers Management**: View and manage phone numbers from the WhatsApp Business API
- **Real-time Data**: Automatic data fetching and caching with RTK Query
- **Modern UI**: Clean, responsive design with professional styling
- **Error Handling**: Comprehensive error handling and loading states

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Make sure the backend server is running on `http://localhost:9000`

## Project Structure

```
src/
├── components/
│   ├── PhoneNumbers.tsx    # Phone numbers display component
│   └── PhoneNumbers.css    # Component styles
├── store/
│   ├── store.ts            # Redux store configuration
│   └── phoneNumbersApi.ts  # RTK Query API slice
├── types/
│   └── index.ts            # TypeScript type definitions
└── App.tsx                 # Main application component
```

## API Integration

The frontend uses RTK Query to handle API calls to the backend:

- **GET /phone-numbers**: Fetches all phone numbers
- Automatic caching and background refetching
- Loading and error states handled automatically

## Components

### PhoneNumbers

Displays a list of phone numbers with their verification status. Features:

- Real-time data fetching
- Refresh functionality
- Error handling with retry option
- Responsive grid layout
- Status indicators with color coding

## Development

To add new API endpoints:

1. Add new endpoints to the appropriate API slice in `store/`
2. Create corresponding components in `components/`
3. Add types to `types/index.ts`
4. Update the main App component to include new components

## Styling

The application uses CSS modules and follows a modern design system with:
- Clean, professional appearance
- Responsive design
- Hover effects and transitions
- Consistent color scheme
