import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService implements OnModuleInit {
  private readonly MESSAGE_KEY = 'messages';
  private readonly MESSAGE_PREFIX = 'message:';

  constructor(private redisService: RedisService) {}

  async onModuleInit() {
    await this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    const existingMessages = await this.findAll();
    if (existingMessages.length === 0) {
      const defaultMessage: Message = {
        id: '1e4145ed-d5f7-44f3-b484-b2e0dbab5a53',
        timestamp: new Date(),
        subject: 'Subject',
        sender: 'Sender',
        recipient: 'Recipient',
        ping: ['Hi', 'What your want ?'],
        pong: ['Hi', 'I need help !']
      };
      await this.create(defaultMessage);
    }
  }

  async create(createMessageDto: CreateMessageDto) {
    const newMessage: Message = {
      ...createMessageDto,
      timestamp: new Date()
    };
    
    // Store individual message
    await this.redisService.set(
      `${this.MESSAGE_PREFIX}${newMessage.id}`,
      newMessage
    );
    
    // Update message IDs list
    const messageIds = await this.getMessageIds();
    messageIds.push(newMessage.id);
    await this.redisService.set(this.MESSAGE_KEY, messageIds);
    
    return newMessage;
  }

  async findAll() {
    const messageIds = await this.getMessageIds();
    const messages: Message[] = [];
    
    for (const id of messageIds) {
      const message = await this.redisService.get<Message>(
        `${this.MESSAGE_PREFIX}${id}`
      );
      if (message) {
        messages.push(message);
      }
    }
    
    return messages;
  }

  async findOne(id: string) {
    return await this.redisService.get<Message>(
      `${this.MESSAGE_PREFIX}${id}`
    );
  }

  async update(id: string, updateMessageDto: UpdateMessageDto) {
    const existingMessage = await this.findOne(id);
    
    if (existingMessage) {
      const updatedMessage: Message = {
        ...existingMessage,
        ...updateMessageDto,
        timestamp: new Date()
      };
      
      await this.redisService.set(
        `${this.MESSAGE_PREFIX}${id}`,
        updatedMessage
      );
      
      return updatedMessage;
    }
    
    return null;
  }

  async remove(id: string) {
    const existingMessage = await this.findOne(id);
    
    if (existingMessage) {
      // Remove message
      await this.redisService.del(`${this.MESSAGE_PREFIX}${id}`);
      
      // Update message IDs list
      const messageIds = await this.getMessageIds();
      const filteredIds = messageIds.filter(msgId => msgId !== id);
      await this.redisService.set(this.MESSAGE_KEY, filteredIds);
      
      return { message: 'Message deleted successfully' };
    }
    
    return null;
  }

  private async getMessageIds(): Promise<string[]> {
    const messageIds = await this.redisService.get<string[]>(this.MESSAGE_KEY);
    return messageIds || [];
  }
}
