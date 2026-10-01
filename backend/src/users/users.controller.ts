import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { SearchUsersDto } from './dto/search-users.dto.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

type UploadedFile = {
  buffer: Buffer;
};

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  @Get()
  async getUsers() {
    return this.usersService.getUsers();
  }

  @Get('search')
  async searchUsers(
    @Query() query: SearchUsersDto,
  ) {
    return this.usersService.searchUsers(query.q);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.getProfile(
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      req.user.id,
      updateProfileDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: UploadedFile,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Avatar image is required.',
      );
    }

    const result =
      await this.cloudinaryService.uploadImage(file);

    return this.usersService.updateAvatar(
      req.user.id,
      result.secure_url,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/cover')
  @UseInterceptors(FileInterceptor('cover'))
  async uploadCoverPhoto(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: UploadedFile,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Cover photo is required.',
      );
    }

    const result =
      await this.cloudinaryService.uploadImage(file);

    return this.usersService.updateCoverPhoto(
      req.user.id,
      result.secure_url,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile/avatar')
  async deleteAvatar(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.deleteAvatar(
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile/cover')
  async deleteCoverPhoto(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.deleteCoverPhoto(
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId/posts')
  async getUserPosts(
    @Param('userId') userId: string,
  ) {
    return this.usersService.getUserPosts(
      userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getPublicProfile(
    @Param('userId') userId: string,
  ) {
    return this.usersService.getPublicProfile(
      userId,
    );
  }
}
