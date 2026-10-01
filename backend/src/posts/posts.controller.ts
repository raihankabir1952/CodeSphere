import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Req,
  Delete,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { PostsService } from './posts.service.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { GetPostsDto } from './dto/get-posts.dto.js';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

type UploadedFile = {
  buffer: Buffer;
};

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createPost(
    @Req() req: AuthenticatedRequest,
    @Body('content') content: string,
    @UploadedFile() file?: UploadedFile,
  ) {
    if (!content?.trim()) {
      throw new BadRequestException(
        'Post content is required.',
      );
    }

    let imageUrl: string | undefined;

    if (file) {
      const result =
        await this.cloudinaryService.uploadPostImage(file);

      imageUrl = result.secure_url;
    }

    return this.postsService.createPost(
      req.user.id,
      content.trim(),
      imageUrl,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updatePost(
    @Param('id') postId: string,
    @Req() req: AuthenticatedRequest,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(
      postId,
      req.user.id,
      updatePostDto.content,
    );
  }


  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(
    @Param('id') postId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.postsService.deletePost(
      postId,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getPosts(
    @Query() query: GetPostsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.postsService.getPosts(
      query.page,
      query.limit,
      req.user.id,
      query.search,
    );
  }
}