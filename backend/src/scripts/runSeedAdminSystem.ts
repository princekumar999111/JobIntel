import { connectDB } from '../config/db';
import { seedAdminSystem } from './seedAdminSystem';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || '';
    
    console.log('Connecting to MongoDB...');
    await connectDB(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    console.log('Starting admin system seeding...');
    await seedAdminSystem();
    
    console.log('Seeding complete! Exiting...');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

main();
