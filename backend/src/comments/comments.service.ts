import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsGateway } from '../notifications/notifications.gateway.js';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async createComment(
    userId: string,
    postId: string,
    content: string,
    parentId?: string,
  ) {
    const post =
      await this.prisma.post.findUnique({
        where: {
          id: postId,
        },
      });

    if (!post) {
      throw new NotFoundException(
        'Post not found',
      );
    }

    let parentComment: {
      id: string;
      userId: string;
      postId: string;
    } | null = null;

    if (parentId) {
      parentComment =
        await this.prisma.comment.findUnique({
          where: {
            id: parentId,
          },
          select: {
            id: true,
            userId: true,
            postId: true,
          },
        });

      if (!parentComment) {
        throw new NotFoundException(
          'Parent comment not found',
        );
      }

      if (parentComment.postId !== postId) {
        throw new NotFoundException(
          'Parent comment does not belong to this post',
        );
      }
    }

    const comment =
      await this.prisma.comment.create({
        data: {
          content: content.trim(),
          userId,
          postId,
          parentId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

    const commenter = comment.user;

    // Reply notification
    if (parentComment) {
      if (parentComment.userId !== userId) {
        this.notificationsGateway.sendNotification(
          parentComment.userId,
          {
            type: 'reply',
            postId,
            userName: commenter.name,
            message: `${commenter.name} replied to your comment.`,
          },
        );
      }
    }

    // Comment notification
    else {
      if (post.authorId !== userId) {
        this.notificationsGateway.sendNotification(
          post.authorId,
          {
            type: 'comment',
            postId,
            userName: commenter.name,
            message: `${commenter.name} commented on your post.`,
          },
        );
      }
    }

    // Real-time comment update
    this.notificationsGateway.sendCommentCreated({
      postId,
      comment: {
        id: comment.id,
        content: comment.content,
        userId: comment.userId,
        parentId: comment.parentId,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: comment.user,
      },
    });

    return comment;
  }

  async getComments(postId: string) {
    const post =
      await this.prisma.post.findUnique({
        where: {
          id: postId,
        },
      });

    if (!post) {
      throw new NotFoundException(
        'Post not found',
      );
    }

    const comments =
      await this.prisma.comment.findMany({
        where: {
          postId,
          parentId: null,
        },
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          replies: {
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

    return {
      data: comments,
      meta: {
        total: comments.length,
      },
    };
  }

  async updateComment(
    commentId: string,
    userId: string,
    content: string,
  ) {
    const comment =
      await this.prisma.comment.findUnique({
        where: {
          id: commentId,
        },
      });

    if (!comment) {
      throw new NotFoundException(
        'Comment not found',
      );
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'You can only update your own comments',
      );
    }

    return this.prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async deleteComment(
    commentId: string,
    userId: string,
  ) {
    const comment =
      await this.prisma.comment.findUnique({
        where: {
          id: commentId,
        },
      });

    if (!comment) {
      throw new NotFoundException(
        'Comment not found',
      );
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own comments',
      );
    }

    await this.prisma.comment.delete({
      where: {
        id: commentId,
      },
    });

    return {
      message: 'Comment deleted successfully',
    };
  }
}
