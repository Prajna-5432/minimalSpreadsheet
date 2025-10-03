import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TablePage from './components/TablePage';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <header className="App-header">
          <h1>Spreadsheet Application</h1>
        </header>
        
        <main className="App-main">
          <TablePage />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
