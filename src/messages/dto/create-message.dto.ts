export class CreateMessageDto {
  id: string;
  timestamp: Date;
  subject: string;
  sender: string;
  recipient: string;
  ping: string[];
  pong: string[];
}
