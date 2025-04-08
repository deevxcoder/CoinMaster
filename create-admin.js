// Script to create an admin user
const { drizzle } = require('drizzle-orm/node-postgres');
const { eq } = require('drizzle-orm');
const { Pool } = require('pg');
const { hashPassword } = require('./server/auth');

const seed = async () => {
  try {
    // Import the schema
    const schema = require('./shared/schema');
    
    // Set up the database connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const pool = new Pool({ connectionString });
    const db = drizzle(pool, { schema });
    
    // Check if admin already exists
    const admins = await db.select().from(schema.users).where(eq(schema.users.isAdmin, true));
    
    if (admins.length > 0) {
      console.log('Admin user already exists:');
      console.log('Username:', admins[0].username);
      console.log('Please use this account to log in.');
      process.exit(0);
    }
    
    // Create admin user
    const hashedPassword = await hashPassword('admin123');
    const [admin] = await db.insert(schema.users).values({
      username: 'admin',
      password: hashedPassword,
      balance: 5000,
      isAdmin: true
    }).returning();
    
    console.log('Created admin user:');
    console.log('Username:', admin.username);
    console.log('Password: admin123');
    console.log('Please use these credentials to log in.');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
};

seed();