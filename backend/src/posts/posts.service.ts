import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) { }

  async createPost(
    authorId: string,
    content: string,
    image?: string,
  ) {
    return this.prisma.post.create({
      data: {
        content,
        image,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getPosts(
    page = 1,
    limit = 10,
    currentUserId?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: search
          ? {
            content: {
              contains: search,
              mode: 'insensitive',
            },
          }
          : undefined,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          likes: currentUserId
            ? {
              where: {
                userId: currentUserId,
              },
              select: {
                id: true,
              },
            }
            : false,
        },
      }),

      this.prisma.post.count({
        where: search
          ? {
            content: {
              contains: search,
              mode: 'insensitive',
            },
          }
          : undefined,
      }),
    ]);

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      image: post.image,
      authorId: post.authorId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author,

      likeCount: post._count.likes,
      commentCount: post._count.comments,

      likedByCurrentUser: currentUserId
        ? post.likes.length > 0
        : false,
    }));

    return {
      data: formattedPosts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  async updatePost(
    postId: string,
    userId: string,
    content: string,
  ) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException(
        'You can only update your own posts',
      );
    }

    return this.prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        content: content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own posts',
      );
    }

    await this.prisma.post.delete({
      where: {
        id: postId,
      },
    });

    return {
      message: 'Post deleted successfully',
    };
  }
}