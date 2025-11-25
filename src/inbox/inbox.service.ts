import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { CreateInboxDto } from './dto/create-inbox.dto';
import { UpdateInboxDto } from './dto/update-inbox.dto';
import { Inbox } from './entities/inbox.entity';

@Injectable()
export class InboxService implements OnModuleInit {
  private readonly INBOX_KEY = 'inboxes';
  private readonly INBOX_PREFIX = 'inbox:';

  constructor(private redisService: RedisService) {}

  async onModuleInit() {
    await this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    const existingInboxes = await this.findAll();
    if (existingInboxes.length === 0) {
      const defaultInbox: Inbox = {
        id: '1',
        listing: 'listing',
        participants: ['1e4145ed-d5f7-44f3-b484-b2e0dbab5a53'],
        subject: 'subject',
      };
      await this.create(defaultInbox);
    }
  }

  async create(createInboxDto: CreateInboxDto) {
    const newInbox: Inbox = {
      ...createInboxDto,
      id: createInboxDto.id || Date.now().toString(),
    };

    // Store individual inbox
    await this.redisService.set(
      `${this.INBOX_PREFIX}${newInbox.id}`,
      newInbox
    );

    // Update inbox IDs list
    const inboxIds = await this.getInboxIds();
    inboxIds.push(newInbox.id);
    await this.redisService.set(this.INBOX_KEY, inboxIds);

    return newInbox;
  }

  async findAll() {
    const inboxIds = await this.getInboxIds();
    const inboxes: Inbox[] = [];

    for (const id of inboxIds) {
      const inbox = await this.redisService.get<Inbox>(
        `${this.INBOX_PREFIX}${id}`
      );
      if (inbox) {
        inboxes.push(inbox);
      }
    }

    return inboxes;
  }

  async findOne(id: string) {
    return await this.redisService.get<Inbox>(
      `${this.INBOX_PREFIX}${id}`
    );
  }

  async update(id: string, updateInboxDto: UpdateInboxDto) {
    const existingInbox = await this.findOne(id);

    if (existingInbox) {
      const updatedInbox: Inbox = {
        ...existingInbox,
        ...updateInboxDto,
      };

      await this.redisService.set(
        `${this.INBOX_PREFIX}${id}`,
        updatedInbox
      );

      return updatedInbox;
    }

    return null;
  }

  async remove(id: string) {
    const existingInbox = await this.findOne(id);

    if (existingInbox) {
      // Remove inbox
      await this.redisService.del(`${this.INBOX_PREFIX}${id}`);

      // Update inbox IDs list
      const inboxIds = await this.getInboxIds();
      const filteredIds = inboxIds.filter(inboxId => inboxId !== id.toString());
      await this.redisService.set(this.INBOX_KEY, filteredIds);

      return { message: `Inbox #${id} removed successfully` };
    }

    return null;
  }

  private async getInboxIds(): Promise<string[]> {
    const inboxIds = await this.redisService.get<string[]>(this.INBOX_KEY);
    return inboxIds || [];
  }
}
