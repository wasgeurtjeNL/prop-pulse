// ============================================
// AI CODE GENERATOR
// Generates code to implement decisions
// ============================================

import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { GeneratedCode, GeneratedFile, AIAction } from './types';

export class AICodeGenerator {
  private openai: OpenAI;
  private projectRoot: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.projectRoot = process.cwd();
  }

  /**
   * Generate code for an AI action
   */
  async generateCode(action: AIAction, context: string = ''): Promise<GeneratedCode> {
    // Get project context
    const projectContext = await this.getProjectContext();
    
    const systemPrompt = `You are an expert Next.js/TypeScript developer working on a real estate platform called PSM Phuket.
You are generating code for an autonomous AI system that can modify and improve itself.

## TECH STACK
- Framework: Next.js 16 (App Router with Server Components)
- Database: Prisma with PostgreSQL (Supabase)
- Styling: Tailwind CSS 4
- Auth: Better Auth
- Components: shadcn/ui
- Language: TypeScript (strict mode, no 'any' types)
- Image CDN: ImageKit.io
- Deployment: Vercel

## DATABASE SCHEMA
${projectContext.schema}

## EXISTING UTILITIES & SERVICES
${projectContext.utilities}

## CODE PATTERNS FROM THIS PROJECT
${projectContext.patterns}

## STRICT RULES
1. Follow existing code patterns EXACTLY - study the examples above
2. Use TypeScript with strict types - NEVER use 'any' type
3. Import prisma from '@/lib/prisma' or relative path '../prisma'
4. Use existing utilities: getOptimizedImageUrl from '@/lib/imagekit'
5. Use existing services: geocodePropertyLocation from '@/lib/services/poi/geocoding'
6. For server actions: add 'use server' at top of file
7. For cache invalidation: use revalidatePath() or revalidateTag()
8. Include proper error handling with try/catch
9. For API routes: validate input with Zod, check auth where needed
10. NEVER modify: auth.ts, .env, middleware.ts, prisma/schema.prisma

## OUTPUT FORMAT
Return a JSON object:
{
  "files": [
    {
      "path": "lib/actions/newFile.ts",
      "content": "complete file content",
      "action": "CREATE" | "MODIFY" | "DELETE",
      "language": "typescript"
    }
  ],
  "testFiles": [],
  "explanation": "What this code does and why",
  "estimatedImpact": "Expected improvement (e.g., 'Fixes 6 properties with missing images')",
  "rollbackPlan": "How to undo: delete the created files"
}`;

    const userPrompt = `Generate production-ready code for this improvement:

## ACTION
Type: ${action.type}
Payload: ${JSON.stringify(action.payload, null, 2)}

## CONTEXT
${context}

## PROJECT STRUCTURE
${projectContext.structure}

## REQUIREMENTS
1. The code must work immediately without modifications
2. Follow the exact patterns shown in the examples above
3. Use existing utilities and services - don't recreate them
4. Include proper TypeScript types
5. Add helpful comments explaining complex logic
6. Make functions reusable and testable`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more consistent code
        max_tokens: 8000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      
      // Validate the response
      return this.validateGeneratedCode(parsed);
    } catch (error) {
      console.error('Code generation failed:', error);
      throw new Error(`Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a blog post
   */
  async generateBlog(topic: string, options: {
    language?: 'en' | 'nl';
    length?: 'short' | 'medium' | 'long';
    includeImages?: boolean;
  } = {}): Promise<GeneratedCode> {
    const { language = 'en', length = 'medium', includeImages = true } = options;

    const lengthGuide = {
      short: '500-800 words',
      medium: '1000-1500 words',
      long: '2000-3000 words',
    };

    const systemPrompt = `You are a premium real estate content writer for PSM Phuket.
Write engaging, SEO-optimized content about Phuket and Thailand real estate.

STYLE:
- Professional but approachable
- Focus on value for investors and expats
- Include actionable insights
- Use data and statistics where relevant

SEO REQUIREMENTS:
- Include H2 and H3 headings
- Use bullet points and lists
- Include a compelling meta description
- Natural keyword usage`;

    const userPrompt = `Write a ${length} blog post (${lengthGuide[length]}) about:
"${topic}"

Language: ${language === 'nl' ? 'Dutch' : 'English'}

Return JSON with:
{
  "title": "Blog title",
  "slug": "url-friendly-slug",
  "excerpt": "Short excerpt for cards (max 160 chars)",
  "metaDescription": "SEO meta description (max 160 chars)",
  "content": "Full markdown content with headings, lists, etc.",
  "tags": ["tag1", "tag2"],
  "category": "investment | lifestyle | legal | market | guide"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    const blog = JSON.parse(content);

    // Create the blog via the existing API
    return {
      files: [],
      explanation: `Generated blog: ${blog.title}`,
      estimatedImpact: 'New content for SEO and traffic',
      rollbackPlan: 'Delete the blog from the database',
      // Return the blog data in payload for the executor to handle
      ...blog,
    };
  }

  /**
   * Generate a fix for a bug
   */
  async generateBugFix(bugDescription: string, errorLog: string, filePath?: string): Promise<GeneratedCode> {
    let fileContent = '';
    if (filePath) {
      try {
        fileContent = await fs.readFile(path.join(this.projectRoot, filePath), 'utf-8');
      } catch {
        // File might not exist
      }
    }

    return this.generateCode(
      {
        type: 'MODIFY_FILE',
        payload: {
          bugDescription,
          errorLog,
          filePath,
        },
      },
      fileContent ? `CURRENT FILE CONTENT:\n\`\`\`\n${fileContent}\n\`\`\`` : ''
    );
  }

  /**
   * Generate SEO improvements for a page
   */
  async generateSEOFix(pagePath: string, issues: string[]): Promise<GeneratedCode> {
    let fileContent = '';
    try {
      fileContent = await fs.readFile(path.join(this.projectRoot, pagePath), 'utf-8');
    } catch {
      throw new Error(`Cannot read file: ${pagePath}`);
    }

    return this.generateCode(
      {
        type: 'MODIFY_FILE',
        payload: {
          pagePath,
          issues,
          optimizations: [
            'Add or improve metadata export',
            'Add generateMetadata function if dynamic',
            'Improve heading structure',
            'Add alt text to images',
            'Add structured data if applicable',
          ],
        },
      },
      `CURRENT FILE CONTENT:\n\`\`\`\n${fileContent}\n\`\`\``
    );
  }

  /**
   * Generate a new feature
   */
  async generateFeature(featureDescription: string, requirements: string[]): Promise<GeneratedCode> {
    return this.generateCode(
      {
        type: 'CREATE_FILE',
        payload: {
          featureDescription,
          requirements,
        },
      },
      `REQUIREMENTS:\n${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
    );
  }

  /**
   * Get comprehensive project context for AI
   * Reads multiple files to give AI full understanding of codebase patterns
   */
  private async getProjectContext(): Promise<{ structure: string; patterns: string; schema: string; utilities: string }> {
    const patterns: string[] = [];
    const utilities: string[] = [];
    let schema = '';

    // ============================================
    // 1. READ PRISMA SCHEMA (Database structure)
    // ============================================
    try {
      const prismaSchema = await fs.readFile(
        path.join(this.projectRoot, 'prisma/schema.prisma'),
        'utf-8'
      );
      // Extract relevant models (Property, PropertyView, Blog, etc.)
      const relevantModels = this.extractPrismaModels(prismaSchema, [
        'Property', 'PropertyImage', 'PropertyView', 'Blog', 'ViewingRequest',
        'InvestorLead', 'RentalLead', 'Owner', 'RentalBooking'
      ]);
      schema = `DATABASE SCHEMA (Prisma):\n${relevantModels}`;
    } catch {
      schema = 'Schema not available';
    }

    // ============================================
    // 2. READ SERVER ACTIONS (Multiple examples)
    // ============================================
    const actionFiles = [
      'lib/actions/property.actions.ts',
      'lib/actions/analytics.actions.ts',
      'lib/actions/blog.actions.ts',
    ];

    for (const actionFile of actionFiles) {
      try {
        const content = await fs.readFile(path.join(this.projectRoot, actionFile), 'utf-8');
        const fileName = actionFile.split('/').pop();
        // Get first 1500 chars to show patterns
        patterns.push(`SERVER ACTION (${fileName}):\n\`\`\`typescript\n${content.substring(0, 1500)}\n\`\`\``);
      } catch {
        // File not found, skip
      }
    }

    // ============================================
    // 3. READ API ROUTES (Multiple examples)
    // ============================================
    const apiFiles = [
      'app/api/properties/route.ts',
      'app/api/blogs/route.ts',
      'app/api/viewing-request/route.ts',
    ];

    for (const apiFile of apiFiles) {
      try {
        const content = await fs.readFile(path.join(this.projectRoot, apiFile), 'utf-8');
        const fileName = apiFile.split('/').slice(-2).join('/');
        patterns.push(`API ROUTE (${fileName}):\n\`\`\`typescript\n${content.substring(0, 1200)}\n\`\`\``);
      } catch {
        // File not found, skip
      }
    }

    // ============================================
    // 4. READ UTILITIES (Important helpers)
    // ============================================
    const utilFiles = [
      { path: 'lib/utils.ts', name: 'General Utilities' },
      { path: 'lib/imagekit.ts', name: 'ImageKit (Image handling)' },
      { path: 'lib/prisma.ts', name: 'Prisma Client' },
    ];

    for (const util of utilFiles) {
      try {
        const content = await fs.readFile(path.join(this.projectRoot, util.path), 'utf-8');
        utilities.push(`${util.name} (${util.path}):\n\`\`\`typescript\n${content.substring(0, 800)}\n\`\`\``);
      } catch {
        // File not found, skip
      }
    }

    // ============================================
    // 5. READ SERVICES (Business logic)
    // ============================================
    const serviceFiles = [
      'lib/services/poi/geocoding.ts',
      'lib/services/email/templates.ts',
    ];

    for (const serviceFile of serviceFiles) {
      try {
        const content = await fs.readFile(path.join(this.projectRoot, serviceFile), 'utf-8');
        const fileName = serviceFile.split('/').slice(-2).join('/');
        utilities.push(`SERVICE (${fileName}):\n\`\`\`typescript\n${content.substring(0, 1000)}\n\`\`\``);
      } catch {
        // File not found, skip
      }
    }

    // ============================================
    // 6. READ PROJECT RULES (.cursorrules)
    // ============================================
    try {
      const cursorRules = await fs.readFile(path.join(this.projectRoot, '.cursorrules'), 'utf-8');
      // Extract key sections
      const rulesSection = cursorRules.substring(0, 2000);
      patterns.push(`PROJECT CONVENTIONS (.cursorrules):\n${rulesSection}`);
    } catch {
      // File not found, skip
    }

    // ============================================
    // 7. PROJECT STRUCTURE
    // ============================================
    const structure = `
PROJECT STRUCTURE:
==================
app/
  (front)/                 → Public-facing pages (SSR/ISR)
    page.tsx               → Homepage
    properties/[slug]/     → Property detail pages
    blogs/[slug]/          → Blog pages
  (dashboard)/             → Admin dashboard (auth required)
    dashboard/             → Dashboard pages
      ai-agent/            → AI Agent dashboard
      analytics/           → Analytics
      blogs/               → Blog management
  api/                     → API routes
    properties/            → Property CRUD
    blogs/                 → Blog CRUD
    ai-agent/              → AI Agent API
    
components/
  ui/                      → shadcn/ui base components
  new-design/              → Feature-specific components
  shared/                  → Reusable shared components
    dashboard/             → Dashboard components

lib/
  actions/                 → Server Actions (use 'use server')
    property.actions.ts    → Property operations
    analytics.actions.ts   → Analytics data
    blog.actions.ts        → Blog operations
  services/                → Business logic
    poi/                   → POI & geocoding
    email/                 → Email services
  ai-agent/                → AI Agent system
  utils.ts                 → Utility functions (cn, formatPrice, etc.)
  prisma.ts                → Prisma client singleton
  imagekit.ts              → ImageKit helpers
  auth.ts                  → Authentication (Better Auth)
  validations.ts           → Zod schemas

prisma/
  schema.prisma            → Database schema
  migrations/              → Database migrations

IMPORTANT CONVENTIONS:
- Use 'use server' for server actions
- Import prisma from '@/lib/prisma' or '../prisma'
- Use revalidatePath/revalidateTag for cache invalidation
- Use Zod for validation
- Error handling with try/catch
- Return typed responses from actions
`;

    return {
      structure,
      patterns: patterns.join('\n\n---\n\n'),
      schema,
      utilities: utilities.join('\n\n---\n\n'),
    };
  }

  /**
   * Extract specific models from Prisma schema
   */
  private extractPrismaModels(schema: string, modelNames: string[]): string {
    const models: string[] = [];
    
    for (const modelName of modelNames) {
      // Match model definition (using [^}]+ to match anything except closing brace)
      const regex = new RegExp(`model\\s+${modelName}\\s*\\{[^}]+\\}`, 'g');
      const match = schema.match(regex);
      if (match) {
        models.push(match[0]);
      }
    }
    
    // Also extract relevant enums
    const enumRegex = /enum\s+\w+\s*\{[^}]+\}/g;
    const enums = schema.match(enumRegex) || [];
    
    return [...models, ...enums.slice(0, 5)].join('\n\n');
  }

  /**
   * Validate generated code structure
   */
  private validateGeneratedCode(parsed: Record<string, unknown>): GeneratedCode {
    if (!parsed.files || !Array.isArray(parsed.files)) {
      throw new Error('Generated code must have a files array');
    }

    const files: GeneratedFile[] = parsed.files.map((f: Record<string, unknown>) => {
      if (!f.path || typeof f.path !== 'string') {
        throw new Error('Each file must have a path');
      }
      if (f.action !== 'DELETE' && (!f.content || typeof f.content !== 'string')) {
        throw new Error('Each file must have content (unless DELETE)');
      }
      if (!f.action || !['CREATE', 'MODIFY', 'DELETE'].includes(f.action as string)) {
        throw new Error('Each file must have a valid action (CREATE, MODIFY, DELETE)');
      }

      return {
        path: f.path as string,
        content: (f.content as string) || '',
        action: f.action as 'CREATE' | 'MODIFY' | 'DELETE',
        language: (f.language as string) || 'typescript',
      };
    });

    return {
      files,
      testFiles: parsed.testFiles as GeneratedFile[] | undefined,
      explanation: (parsed.explanation as string) || 'Code generated by AI',
      estimatedImpact: (parsed.estimatedImpact as string) || 'Unknown impact',
      rollbackPlan: (parsed.rollbackPlan as string) || 'Restore from backup',
    };
  }

  /**
   * Read an existing file
   */
  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(path.join(this.projectRoot, filePath), 'utf-8');
    } catch {
      return '';
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.projectRoot, filePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List files in a directory
   */
  async listDirectory(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(path.join(this.projectRoot, dirPath), { withFileTypes: true });
      return entries.map(e => e.isDirectory() ? `${e.name}/` : e.name);
    } catch {
      return [];
    }
  }
}

// Singleton instance
export const codeGenerator = new AICodeGenerator();

