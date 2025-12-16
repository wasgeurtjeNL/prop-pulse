import { config } from 'dotenv';
config({ path: '.env' });

import prisma from '../lib/prisma';

async function main() {
  const submissions = await prisma.propertySubmission.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      accessToken: true,
      propertyTitle: true,
      ownerName: true,
      ownerEmail: true,
      status: true,
      createdAt: true,
    },
  });
  
  console.log('\n=== Property Submissions ===\n');
  
  if (submissions.length === 0) {
    console.log('Geen aanvragen gevonden in de database.');
  } else {
    submissions.forEach((s, i) => {
      console.log(`${i + 1}. ${s.propertyTitle}`);
      console.log(`   Owner: ${s.ownerName} (${s.ownerEmail})`);
      console.log(`   Status: ${s.status}`);
      console.log(`   Link: http://localhost:3000/my-submission/${s.accessToken}`);
      console.log('');
    });
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));

