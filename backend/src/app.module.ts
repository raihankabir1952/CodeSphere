import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';

import { AppService } from './app.service.js';

import { AuthModule } from './auth/auth.module.js';

import { EmailModule } from './email/email.module.js';

import { PrismaModule } from './prisma/prisma.module.js';

import { UsersModule } from './users/users.module.js';

import { CloudinaryModule } from './cloudinary/cloudinary.module.js';

import { PostsModule } from './posts/posts.module.js';

import { LikesModule } from './likes/likes.module.js';

import { CommentsModule } from './comments/comments.module.js';

import { NotificationsModule } from './notifications/notifications.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    UsersModule,
    AuthModule,
    EmailModule,
    CloudinaryModule,
    PostsModule,
    LikesModule,
    CommentsModule,
    NotificationsModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule { }