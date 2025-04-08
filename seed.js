// Simple seed script
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { hashPassword } from './server/auth.js';

async function seed() {
  console.log('Starting seeding...');

  // Add admin user
  const hashedAdminPassword = await hashPassword('admin123');
  const [adminUser] = await db.insert(users).values({
    username: 'admin',
    password: hashedAdminPassword,
    balance: 5000,
    isAdmin: true
  }).returning();

  console.log('Created admin user:', adminUser);
}

seed()
  .then(() => {
    console.log('Seed completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Seed error:', error);
    process.exit(1);
  });