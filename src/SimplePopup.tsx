import React from 'react';

const SimplePopup: React.FC = () => {
  return (
    <div style={{ padding: '20px', width: '300px' }}>
      <h1>AI Agent</h1>
      <p>Chrome extension is working!</p>
      <button onClick={() => alert('Button clicked!')}>Test Button</button>
    </div>
  );
};

export default SimplePopup;
