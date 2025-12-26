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
    
    const systemPrompt = `You are an expert Next.js/TypeScript developer working on a real estate platform.
You are generating code for an autonomous AI system that can modify itself.

PROJECT CONTEXT:
- Framework: Next.js 16 (App Router)
- Database: Prisma with PostgreSQL
- Styling: Tailwind CSS 4
- Auth: Better Auth
- Components: shadcn/ui
- Language: TypeScript (strict mode)

EXISTING PATTERNS:
${projectContext.patterns}

RULES:
1. Follow existing code patterns EXACTLY
2. Use TypeScript with strict types - NO 'any' types
3. Use existing utilities from lib/utils.ts
4. Use existing components from components/ui/
5. Include proper error handling
6. For API routes, always validate input and check auth where needed
7. For components, use Server Components by default, Client only when needed
8. NEVER modify: auth files, .env, middleware.ts, prisma/schema.prisma (without migration)

Return a JSON object with this structure:
{
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "content": "file content",
      "action": "CREATE" | "MODIFY" | "DELETE",
      "language": "typescript" | "tsx" | etc
    }
  ],
  "testFiles": [
    // Optional test files
  ],
  "explanation": "What this code does",
  "estimatedImpact": "Expected improvement",
  "rollbackPlan": "How to undo these changes"
}`;

    const userPrompt = `Generate code for this action:

ACTION TYPE: ${action.type}
PAYLOAD: ${JSON.stringify(action.payload, null, 2)}

ADDITIONAL CONTEXT:
${context}

PROJECT STRUCTURE:
${projectContext.structure}

Generate the complete implementation with all necessary files.
Make sure the code is production-ready and follows best practices.`;

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
   * Get project context for AI
   */
  private async getProjectContext(): Promise<{ structure: string; patterns: string }> {
    // Read key files to understand patterns
    const patterns: string[] = [];

    try {
      // Read a sample API route
      const sampleApi = await fs.readFile(
        path.join(this.projectRoot, 'app/api/properties/route.ts'),
        'utf-8'
      );
      patterns.push('API Route Pattern:\n```typescript\n' + sampleApi.substring(0, 1000) + '\n```');
    } catch {
      // File not found, skip
    }

    try {
      // Read a sample server action
      const sampleAction = await fs.readFile(
        path.join(this.projectRoot, 'lib/actions/property.actions.ts'),
        'utf-8'
      );
      patterns.push('Server Action Pattern:\n```typescript\n' + sampleAction.substring(0, 1000) + '\n```');
    } catch {
      // File not found, skip
    }

    // Get folder structure (simplified)
    const structure = `
app/
  (front)/       → Public pages
  (dashboard)/   → Admin dashboard
  api/           → API routes
components/
  ui/            → shadcn/ui components
  new-design/    → Feature components
  shared/        → Reusable components
lib/
  actions/       → Server Actions
  services/      → Business logic
  utils/         → Utilities
  ai-agent/      → AI Agent system
prisma/
  schema.prisma  → Database schema
`;

    return {
      structure,
      patterns: patterns.join('\n\n'),
    };
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

