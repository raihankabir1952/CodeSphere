import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { CommentsService } from './comments.service.js';

import { CreateCommentDto } from './dto/create-comment.dto.js';

import { UpdateCommentDto } from './dto/update-comment.dto.js';

interface AuthenticatedRequest
  extends Request {
  user: {
    id: string;
    email: string;
  };
}

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
  ) {}

  // Create Comment
  @UseGuards(JwtAuthGuard)
  @Post(':postId')
  async createComment(
    @Param('postId') postId: string,
    @Req() req: AuthenticatedRequest,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(
      req.user.id,
      postId,
      createCommentDto.content,
      createCommentDto.parentId,
    );
  }

  // Get Comments
  @Get(':postId')
  async getComments(
    @Param('postId') postId: string,
  ) {
    return this.commentsService.getComments(
      postId,
    );
  }

  // Update Comment
  @UseGuards(JwtAuthGuard)
  @Patch(':commentId')
  async updateComment(
    @Param('commentId') commentId: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(
      commentId,
      req.user.id,
      updateCommentDto.content,
    );
  }

  // Delete Comment
  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  async deleteComment(
    @Param('commentId') commentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commentsService.deleteComment(
      commentId,
      req.user.id,
    );
  }
}