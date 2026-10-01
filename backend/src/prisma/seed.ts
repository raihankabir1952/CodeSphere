import 'dotenv/config';

import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';

//password : Test@123456

const prisma = new PrismaService();

const users = [
  {
    name: 'Arif Hasan',
    email: 'arif@codesphere.test',
    bio: 'Full-stack developer passionate about building scalable web applications.',
    avatar: 'https://i.pravatar.cc/300?img=11',
  },
  {
    name: 'Nabil Ahmed',
    email: 'nabil@codesphere.test',
    bio: 'Frontend developer focused on React, Next.js, and modern UI experiences.',
    avatar: 'https://i.pravatar.cc/300?img=12',
  },
  {
    name: 'Samiul Karim',
    email: 'samiul@codesphere.test',
    bio: 'Backend developer exploring NestJS, APIs, databases, and system design.',
    avatar: 'https://i.pravatar.cc/300?img=13',
  },
  {
    name: 'Tanvir Rahman',
    email: 'tanvir@codesphere.test',
    bio: 'JavaScript enthusiast who enjoys turning ideas into useful products.',
    avatar: 'https://i.pravatar.cc/300?img=14',
  },
  {
    name: 'Fahim Chowdhury',
    email: 'fahim@codesphere.test',
    bio: 'Software engineer interested in clean architecture and developer tools.',
    avatar: 'https://i.pravatar.cc/300?img=15',
  },
  {
    name: 'Nusrat Jahan',
    email: 'nusrat@codesphere.test',
    bio: 'UI-focused developer who loves creating simple and accessible interfaces.',
    avatar: 'https://i.pravatar.cc/300?img=16',
  },
  {
    name: 'Mehedi Hasan',
    email: 'mehedi@codesphere.test',
    bio: 'Problem solver learning cloud technologies and distributed systems.',
    avatar: 'https://i.pravatar.cc/300?img=17',
  },
  {
    name: 'Rafi Ahmed',
    email: 'rafi@codesphere.test',
    bio: 'React and TypeScript developer building interactive web experiences.',
    avatar: 'https://i.pravatar.cc/300?img=18',
  },
  {
    name: 'Sadia Islam',
    email: 'sadia@codesphere.test',
    bio: 'Developer interested in open source, APIs, and collaborative projects.',
    avatar: 'https://i.pravatar.cc/300?img=19',
  },
  {
    name: 'Imran Hossain',
    email: 'imran@codesphere.test',
    bio: 'Tech enthusiast exploring full-stack development and DevOps.',
    avatar: 'https://i.pravatar.cc/300?img=20',
  },
];

const posts = [
  [
    'Just started exploring CodeSphere. Excited to connect with other developers! 🚀',
    'Working on a new full-stack project today. There is always something new to learn.',
    'Clean code is not about writing more code. It is about making the code easier to understand.',
  ],
  [
    'Spent some time improving a React component today. Small improvements can make a big difference.',
    'Next.js App Router has made building modern web applications really interesting.',
    'What frontend technology are you currently learning?',
  ],
  [
    'Today I worked on designing a REST API with NestJS. Backend architecture is fascinating.',
    'Learning more about database relationships and query optimization.',
    'A well-designed API can make frontend development much easier.',
  ],
  [
    'TypeScript makes large JavaScript projects much easier to maintain.',
    'Trying out a new project structure today. Keeping things organized from the beginning really helps.',
    'Building projects is one of the best ways to learn programming.',
  ],
  [
    'Spent today reading about software architecture and clean code principles.',
    'A good folder structure can save a lot of time later in a project.',
    'Working on improving my debugging skills one problem at a time.',
  ],
  [
    'Good UI should feel simple even when the underlying application is complex.',
    'Experimenting with responsive layouts and accessibility today.',
    'Design and development work much better when both sides communicate well.',
  ],
  [
    'Started learning more about cloud deployment and server infrastructure.',
    'Understanding how applications work in production is just as important as building them.',
    'Docker and cloud platforms are definitely on my learning list.',
  ],
  [
    'React hooks continue to make component logic much cleaner.',
    'Working with TypeScript and React today. Loving the developer experience.',
    'Reusable components are one of the most useful concepts in frontend development.',
  ],
  [
    'Open source projects are a great way to learn how experienced developers structure applications.',
    'Looking for interesting projects to contribute to and learn from.',
    'Collaboration makes software development much more enjoyable.',
  ],
  [
    'Learning about deployment pipelines and environment variables today.',
    'Moving a project from localhost to production teaches you a completely different set of lessons.',
    'Building, testing, deploying, and monitoring — the complete development cycle matters.',
  ],
];

async function main() {
  const password = await bcrypt.hash('Test@123456', 10);

  for (let i = 0; i < users.length; i++) {
    const userData = users[i];

    const user = await prisma.user.upsert({
      where: {
        email: userData.email,
      },
      update: {
        name: userData.name,
        bio: userData.bio,
        avatar: userData.avatar,
        emailVerified: true,
      },
      create: {
        name: userData.name,
        email: userData.email,
        password,
        bio: userData.bio,
        avatar: userData.avatar,
        emailVerified: true,
      },
    });

    const existingPosts = await prisma.post.count({
      where: {
        authorId: user.id,
      },
    });

    if (existingPosts === 0) {
      await prisma.post.createMany({
        data: posts[i].map((content) => ({
          content,
          authorId: user.id,
        })),
      });
    }

    console.log(`Created/Updated user: ${user.email}`);
  }

  console.log('');
  console.log('=================================');
  console.log('CodeSphere seed completed!');
  console.log('10 demo users created/updated.');
  console.log('Each user has 3 posts.');
  console.log('Demo password: Test@123456');
  console.log('=================================');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });