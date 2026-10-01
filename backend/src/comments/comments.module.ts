import { Module } from '@nestjs/common';

import { CommentsService } from './comments.service.js';
import { CommentsController } from './comments.controller.js';

import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
