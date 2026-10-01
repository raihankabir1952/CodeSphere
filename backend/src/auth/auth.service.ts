import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) { }

  async register(name: string, email: string, password: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomUUID();

    const verificationExpiresAt = new Date(
      Date.now() + 15 * 60 * 1000,
    );

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpiresAt,
      },
    });

    const {
      password: _,
      emailVerificationToken: __,
      emailVerificationExpiresAt: ___,
      ...userWithoutPassword
    } = user;

    await this.emailService.sendVerificationEmail(
      email,
      name,
      verificationToken,
    );

    return userWithoutPassword;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatched = await bcrypt.compare(password, user.password);

    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const {
      password: _,
      emailVerificationToken: __,
      emailVerificationExpiresAt: ___,
      passwordResetToken: ____,
      passwordResetExpiresAt: _____,
      ...userWithoutSensitiveData
    } = user;

    return {
      accessToken,
      user: userWithoutSensitiveData,
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    if (user.emailVerified) {
      throw new ConflictException('Email is already verified');
    }

    const verificationToken = crypto.randomUUID();

    const verificationExpiresAt = new Date(
      Date.now() + 15 * 60 * 1000,
    );

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpiresAt,
      },
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken,
    );

    return {
      message: 'Verification email sent successfully',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    const resetToken = crypto.randomUUID();

    const resetExpiresAt = new Date(
      Date.now() + 15 * 60 * 1000,
    );

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: resetExpiresAt,
      },
    });

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken,
    );

    return {
      message: 'Password reset email sent successfully',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid password reset token');
    }

    if (
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new UnauthorizedException('Password reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    const {
      password: _,
      emailVerificationToken: __,
      emailVerificationExpiresAt: ___,
      passwordResetToken: ____,
      passwordResetExpiresAt: _____,
      ...userWithoutSensitiveData
    } = updatedUser;

    return {
      message: 'Password reset successfully',
      user: userWithoutSensitiveData,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    if (
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt < new Date()
    ) {
      throw new UnauthorizedException('Verification token has expired');
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    const {
      password: _,
      emailVerificationToken: __,
      emailVerificationExpiresAt: ___,
      ...userWithoutSensitiveData
    } = updatedUser;

    return {
      message: 'Email verified successfully',
      user: userWithoutSensitiveData,
    };

  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
