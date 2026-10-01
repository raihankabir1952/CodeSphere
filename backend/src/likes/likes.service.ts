import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsGateway } from '../notifications/notifications.gateway.js';

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async toggleLike(
    userId: string,
    postId: string,
  ) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        author: true,
      },
    });

    if (!post) {
      throw new NotFoundException(
        'Post not found',
      );
    }

    const existingLike =
      await this.prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

    // Unlike
    if (existingLike) {
      await this.prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });

      const likeCount =
        await this.prisma.like.count({
          where: {
            postId,
          },
        });

      // Real-time like update
      this.notificationsGateway.sendLikeUpdate(
        postId,
        {
          liked: false,
          likeCount,
        },
      );

      return {
        liked: false,
        likeCount,
      };
    }

    // Like
    await this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    const likeCount =
      await this.prisma.like.count({
        where: {
          postId,
        },
      });

    // Real-time like update
    this.notificationsGateway.sendLikeUpdate(
      postId,
      {
        liked: true,
        likeCount,
      },
    );

    // Notification to post owner
    if (post.authorId !== userId) {
      const liker =
        await this.prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            name: true,
          },
        });

      if (liker) {
        this.notificationsGateway.sendNotification(
          post.authorId,
          {
            type: 'like',
            postId,
            userName: liker.name,
            message: `${liker.name} liked your post.`,
          },
        );
      }
    }

    return {
      liked: true,
      likeCount,
    };
  }
}
