/**
 * Export blogs from local database to JSON
 * Run with: node scripts/export-blogs.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

// Use DATABASE_URL from .env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function exportBlogs() {
  console.log('📚 Exporting blogs from database...\n');
  console.log('Database URL:', connectionString.replace(/:[^@]+@/, ':***@'));

  try {
    // Get all blogs
    const blogsResult = await pool.query(`
      SELECT 
        b.*,
        u.email as author_email
      FROM blog b
      LEFT JOIN "user" u ON b."authorId" = u.id
      ORDER BY b."createdAt" ASC
    `);

    // Get all blog categories
    const categoriesResult = await pool.query(`
      SELECT * FROM blog_category ORDER BY "order" ASC
    `);

    const blogs = blogsResult.rows;
    const categories = categoriesResult.rows;

    console.log(`Found ${blogs.length} blogs`);
    console.log(`Found ${categories.length} categories`);

    // Create export object
    const exportData = {
      exportedAt: new Date().toISOString(),
      categories,
      blogs,
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
    console.error('❌ Error exporting blogs:', error.message);
  } finally {
    await pool.end();
  }
}

exportBlogs();
