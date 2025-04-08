import { db } from './server/db';
import { users, games, deposits, depositStatusEnum } from './shared/schema';
import { hashPassword } from './server/auth';
import { eq } from 'drizzle-orm';

async function seedDatabase() {
  console.log('Starting database seeding...');

  // First, let's clear existing data (optional - be careful in production!)
  console.log('Clearing existing data...');
  await db.delete(games);
  await db.delete(deposits);
  await db.delete(users);

  // 1. Create 10 users (1 admin, 9 regular users)
  console.log('Creating users...');
  
  // Create admin user
  const hashedAdminPassword = await hashPassword('admin123');
  await db.insert(users).values({
    username: 'admin',
    password: hashedAdminPassword,
    balance: 5000,
    isAdmin: true
  });
  
  // Create regular users
  const userNames = ['john', 'alice', 'bob', 'charlie', 'david', 'emma', 'frank', 'grace', 'henry'];
  const userBalances = [1500, 2200, 800, 3500, 450, 2800, 1800, 720, 4100];
  
  for (let i = 0; i < userNames.length; i++) {
    const hashedPassword = await hashPassword('password123');
    await db.insert(users).values({
      username: userNames[i],
      password: hashedPassword,
      balance: userBalances[i],
      isAdmin: false
    });
  }
  
  // Retrieve created users for reference
  const createdUsers = await db.select().from(users);
  console.log(`Created ${createdUsers.length} users`);
  
  // 2. Create game history
  console.log('Creating game history...');
  
  // Game types and results
  const gameTypes = ['coin-toss', 'odd-even'];
  const coinSides = ['heads', 'tails'];
  const numberParities = ['odd', 'even'];
  const diceResults = ['1', '2', '3', '4', '5', '6'];
  
  // Create 50 random games across users
  for (let i = 0; i < 50; i++) {
    const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const gameType = gameTypes[Math.floor(Math.random() * gameTypes.length)];
    const betAmount = Math.floor(Math.random() * 200) + 50; // Between 50 and 250
    
    let playerChoice, result;
    
    if (gameType === 'coin-toss') {
      playerChoice = coinSides[Math.floor(Math.random() * coinSides.length)];
      result = coinSides[Math.floor(Math.random() * coinSides.length)];
    } else {
      playerChoice = numberParities[Math.floor(Math.random() * numberParities.length)];
      const diceValue = diceResults[Math.floor(Math.random() * diceResults.length)];
      result = diceValue;
    }
    
    // Determine if the player won
    let isWin;
    if (gameType === 'coin-toss') {
      isWin = playerChoice === result;
    } else {
      const resultIsEven = parseInt(result) % 2 === 0;
      isWin = (playerChoice === 'even' && resultIsEven) || 
              (playerChoice === 'odd' && !resultIsEven);
    }
    
    const payout = isWin ? betAmount * 2 : 0;
    
    // Calculate timestamp within last 7 days
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 7));
    
    await db.insert(games).values({
      userId: user.id,
      gameType,
      betAmount,
      playerChoice,
      result,
      isWin,
      payout,
      playedAt: timestamp
    });
  }
  
  // 3. Create deposit history
  console.log('Creating deposit history...');
  
  const paymentMethods = ['upi', 'bank_transfer', 'cash'];
  const statuses = ['pending', 'approved', 'rejected'];
  
  // Create 30 random deposits
  for (let i = 0; i < 30; i++) {
    const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const amount = Math.floor(Math.random() * 1000) + 100; // Between 100 and 1100
    const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Calculate timestamp within last 14 days
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 14));
    
    await db.insert(deposits).values({
      userId: user.id,
      amount,
      method,
      proofInfo: `Transaction ID: TXID${Math.floor(Math.random() * 10000000)}`,
      status,
      adminNotes: status === 'rejected' ? 'Invalid transaction details' : '',
      createdAt: timestamp,
      updatedAt: timestamp,
      hasProofFile: Math.random() > 0.7 // 30% chance of having a proof file
    });
  }
  
  console.log('Database seeding completed!');
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('Seed script executed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running seed script:', error);
    process.exit(1);
  });