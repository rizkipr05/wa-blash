import React from 'react';
import { MessageSquareText } from 'lucide-react';

const FloatingChat = () => {
  return (
    <div className="floating-chat" onClick={() => window.open('https://wa.me/628123456789', '_blank')}>
      <MessageSquareText size={28} />
    </div>
  );
};

export default FloatingChat;
