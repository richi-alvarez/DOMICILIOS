const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const catalogs = await prisma.catalog.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
      }
    });
    
    console.log('Available catalogs:');
    catalogs.forEach(c => {
      console.log(`  ID: ${c.id} | Name: ${c.name} | Status: ${c.status}`);
    });
    
    if (catalogs.length > 0) {
      console.log('\nFirst catalog ID:', catalogs[0].id);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
