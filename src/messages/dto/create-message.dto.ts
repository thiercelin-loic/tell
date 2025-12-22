export class MessageItemDto {
  sender: string;
  content: string;
  timestamp: Date;
}

export class CreateMessageDto {
  id: string;
  messages: MessageItemDto[];
}
