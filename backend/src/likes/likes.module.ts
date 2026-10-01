import { Module } from '@nestjs/common';

import { LikesService } from './likes.service.js';
import { LikesController } from './likes.controller.js';

import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
  ],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}
