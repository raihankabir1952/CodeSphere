import {
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { LikesService } from './likes.service.js';

interface AuthenticatedRequest
  extends Request {
  user: {
    id: string;
    email: string;
  };
}

@Controller('likes')
export class LikesController {
  constructor(
    private readonly likesService: LikesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post(':postId')
  async toggleLike(
    @Param('postId') postId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.likesService.toggleLike(
      req.user.id,
      postId,
    );
  }
}