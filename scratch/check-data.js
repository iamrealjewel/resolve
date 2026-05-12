const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  const companies = await prisma.company.findMany();
  console.log('Companies:', JSON.stringify(companies, null, 2));
  const locations = await prisma.location.findMany();
  console.log('Locations:', JSON.stringify(locations, null, 2));
  const users = await prisma.user.findMany({
    where: { email: 'jahirul.islam@ispahanibd.com' }
  });
  console.log('User:', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
