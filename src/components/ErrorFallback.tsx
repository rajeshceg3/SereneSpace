// src/components/ErrorFallback.tsx
import React from 'react';

export const ErrorFallback = ({ message }: { message: string }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1a0000', // Dark red
        color: '#ffdddd', // Light pink
        fontFamily: 'sans-serif',
        fontSize: '1.5rem',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div>
        <h2>Something went wrong</h2>
        <p>{message}</p>
        <p>Please try refreshing the page.</p>
      </div>
    </div>
  );
};
