
import React from 'react';

interface BasicComponentProps {
  message?: string;
}

const BasicComponent: React.FC<BasicComponentProps> = ({ message = "Hello from BasicComponent!" }) => {
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '20px 0' }}>
      <h2 style={{ color: '#333' }}>Basic Component</h2>
      <p>{message}</p>
    </div>
  );
};

export default BasicComponent;
