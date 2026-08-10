import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  console.log('Starting deterministic test seed...');

  // DEFENSIVE ENV CHECK
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: Refusing to run test seed in production environment.');
    process.exit(1);
  }
  
  if (process.env.TEST_DATABASE !== 'true') {
    console.error('CRITICAL: TEST_DATABASE env var is not explicitly set to "true". Refusing to run.');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('test')) {
    console.error('CRITICAL: DATABASE_URL does not appear to point to a test database. Refusing to run.');
    process.exit(1);
  }

  // Ensure database is clean if run repeatedly in isolation
  await prisma.activityLog.deleteMany();
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.submissionBill.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.billTrip.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.tripExpense.deleteMany();
  await prisma.tripDocumentFile.deleteMany();
  await prisma.tripDocument.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.vehicleDocument.deleteMany();
  await prisma.ownVehicle.deleteMany();
  await prisma.vehicleDirectory.deleteMany();
  await prisma.party.deleteMany();
  await prisma.numberSequence.deleteMany();
  await prisma.financialYear.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const superadmin = await prisma.user.create({
    data: {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'superadmin',
      full_name: 'Super Admin',
      password_hash: passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    }
  });

  await prisma.user.create({
    data: {
      id: '00000000-0000-0000-0000-000000000002',
      username: 'testuser',
      full_name: 'Test User',
      password_hash: passwordHash,
      role: 'USER',
      status: 'ACTIVE',
    }
  });

  // Create Financial Year
  const currentYear = new Date().getFullYear();
  const fYear = await prisma.financialYear.create({
    data: {
      id: '00000000-0000-0000-0000-000000000003',
      display_name: `${currentYear}-${(currentYear + 1).toString().slice(2)}`,
      start_date: new Date(`${currentYear}-04-01T00:00:00.000Z`),
      end_date: new Date(`${currentYear + 1}-03-31T23:59:59.999Z`),
      is_active: true,
    }
  });

  // Create Sequences
  await prisma.numberSequence.createMany({
    data: [
      { financial_year_id: fYear.id, sequence_key: 'TRIP', prefix: 'TRP', last_number: 0 },
      { financial_year_id: fYear.id, sequence_key: 'BILL', prefix: 'INV', last_number: 0 },
      { financial_year_id: fYear.id, sequence_key: 'SUBMISSION', prefix: 'SUB', last_number: 0 },
      { financial_year_id: fYear.id, sequence_key: 'PAYMENT', prefix: 'PAY', last_number: 0 },
    ]
  });

  // Create Party
  const party = await prisma.party.create({
    data: {
      id: '00000000-0000-0000-0000-000000000004',
      party_name: 'TEST MARKET PARTY',
      party_type: 'MARKET',
      is_active: true,
      billing_type: 'INDIVIDUAL',
    }
  });

  // Create Vehicle
  await prisma.ownVehicle.create({
    data: {
      id: '00000000-0000-0000-0000-000000000005',
      vehicle_number: 'MH01AA1111',
      status: 'ACTIVE',
    }
  });

  console.log('Deterministic test seed complete.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
