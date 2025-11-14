import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesModule } from './messages/messages.module';
import { InboxModule } from './inbox/inbox.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [RedisModule, MessagesModule, InboxModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
