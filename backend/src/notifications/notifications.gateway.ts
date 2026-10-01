import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

type NotificationType =
  | 'like'
  | 'comment'
  | 'reply';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>();

  handleDisconnect(client: Socket) {
    for (const [
      userId,
      socketId,
    ] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);

        console.log(
          `User ${userId} disconnected`,
        );

        this.server.emit(
          'userOffline',
          {
            userId,
          },
        );

        break;
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.userSockets.set(
      userId,
      client.id,
    );

    client.join(`user:${userId}`);

    console.log(
      `User ${userId} connected with socket ${client.id}`,
    );

    // Send currently online users
    // to the newly connected user
    client.emit('onlineUsers', {
      userIds: Array.from(
        this.userSockets.keys(),
      ),
    });

    // Notify all connected users
    // that this user is online
    this.server.emit(
      'userOnline',
      {
        userId,
      },
    );
  }

  @SubscribeMessage('ping')
  handlePing(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.emit('pong', {
      message: `Server received: ${message}`,
    });
  }

  sendNotification(
    userId: string,
    data: {
      type: NotificationType;
      postId: string;
      userName: string;
      message: string;
    },
  ) {
    if (!this.userSockets.has(userId)) {
      return;
    }

    this.server
      .to(`user:${userId}`)
      .emit(
        'notification',
        data,
      );
  }

  sendLikeUpdate(
    postId: string,
    data: {
      liked: boolean;
      likeCount: number;
    },
  ) {
    this.server.emit(
      'likeUpdated',
      {
        postId,
        ...data,
      },
    );
  }

  sendCommentCreated(
    data: {
      postId: string;
      comment: {
        id: string;
        content: string;
        userId: string;
        parentId: string | null;
        createdAt: string;
        updatedAt: string;
        user: {
          id: string;
          name: string;
          avatar: string | null;
        };
      };
    },
  ) {
    this.server.emit(
      'commentCreated',
      data,
    );
  }
}
