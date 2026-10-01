import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getProfile(userId: string) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          coverPhoto: true,
          bio: true,
          emailVerified: true,
          createdAt: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return user;
  }

  async getPublicProfile(userId: string) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          coverPhoto: true,
          bio: true,
          emailVerified: true,
          createdAt: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return user;
  }

  async getUserPosts(userId: string) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const posts =
      await this.prisma.post.findMany({
        where: {
          authorId: userId,
        },
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

          comments: {
            where: {
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
          },

          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

    return {
      data: posts,
      meta: {
        total: posts.length,
      },
    };
  }

  async updateProfile(
    userId: string,
    updateProfileDto: {
      name?: string;
      bio?: string;
    },
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(updateProfileDto.name !==
          undefined && {
          name: updateProfileDto.name,
        }),

        ...(updateProfileDto.bio !==
          undefined && {
          bio: updateProfileDto.bio,
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  async searchUsers(query?: string) {
    const search = query?.trim();

    if (!search) {
      return {
        data: [],
      };
    }

    const users =
      await this.prisma.user.findMany({
        where: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
          avatar: true,
        },
        orderBy: {
          name: 'asc',
        },
        take: 8,
      });

    return {
      data: users,
    };
  }

  async updateAvatar(
    userId: string,
    avatarUrl: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        avatar: avatarUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  async updateCoverPhoto(
    userId: string,
    coverPhotoUrl: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        coverPhoto: coverPhotoUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }
  async deleteAvatar(userId: string) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        avatar: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  async deleteCoverPhoto(userId: string) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        coverPhoto: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }
}
