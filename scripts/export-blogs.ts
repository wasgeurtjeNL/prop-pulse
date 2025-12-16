/**
 * Export blogs from local database to JSON
 * Run with: npx tsx scripts/export-blogs.ts
 */

const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function exportBlogs() {
  console.log('📚 Exporting blogs from local database...\n');

  try {
    // Get all blogs with their categories
    const blogs = await prisma.blog.findMany({
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get all blog categories
    const categories = await prisma.blogCategory.findMany({
      orderBy: { order: 'asc' },
    });

    console.log(`Found ${blogs.length} blogs`);
    console.log(`Found ${categories.length} categories`);

    // Create export object
    const exportData = {
      exportedAt: new Date().toISOString(),
      categories,
      blogs: blogs.map(blog => ({
        ...blog,
        // Remove relations that will be recreated
        category: undefined,
        author: undefined,
        linkUsages: undefined,
        // Keep authorId for reference
        authorEmail: blog.author?.email,
      })),
    };

    // Write to file
    const outputPath = 'scripts/blog-export.json';
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

    console.log(`\n✅ Exported to ${outputPath}`);
    console.log(`\nBlogs exported:`);
    blogs.forEach((blog, i) => {
      console.log(`  ${i + 1}. ${blog.title} (${blog.published ? 'published' : 'draft'})`);
    });

  } catch (error) {
    console.error('❌ Error exporting blogs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportBlogs();

