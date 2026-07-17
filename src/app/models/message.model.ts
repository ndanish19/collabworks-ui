export type MessageType = 'PRIVATE' | 'PROJECT';

export interface Message {
  id: number;
  content: string;
  sentAt: string;
  messageType: MessageType;
  senderId: number;
  senderName: string;
  receiverId?: number;
  receiverName?: string;
  projectId?: number;
  projectName?: string;
}

export interface ConversationUser {
  id: number;
  name: string;
  role: string;
}
