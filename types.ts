export interface ChatMessagePart {
  text?: string;
  image?: {
    base64: string;
    mimeType: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: ChatMessagePart[];
  timestamp: string;
}
