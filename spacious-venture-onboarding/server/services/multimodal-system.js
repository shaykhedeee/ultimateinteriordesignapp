import fs from 'node:fs';
import path from 'node:path';
import { rootDir } from './database.js';
import { getProviderStatus } from './image-provider.js';
import { isNativeOpenAiKey } from './provider-config.js';

export function getMultimodalSystemStatus() {
  const providers = getProviderStatus();
  const publicWebsitePath = path.join(rootDir, 'public-website', 'index.html');
  const studioBuildPath = path.join(rootDir, 'frontend', 'dist', 'index.html');

  const modalities = {
    text: {
      status: 'active',
      inputs: ['client intake', 'room notes', 'budget/style requirements', 'revision instructions'],
      outputs: ['structured prompts', 'project summaries', 'proposal copy']
    },
    image: {
      status: providers.clientSafeLiveReady ? 'active' : 'fallback-only',
      inputs: ['floor-plan images', 'site photos', 'style photos', 'reference uploads'],
      outputs: ['stored renders', 'reference matches', 'client-safe render variants'],
      providers: providers.clientSafeProviders
    },
    pdf: {
      status: 'active',
      inputs: ['floor-plan PDFs'],
      outputs: ['client brief PDFs', 'cutlist PDFs', 'job summary PDFs', 'labels']
    },
    structuredData: {
      status: 'active',
      inputs: ['room zones', 'component markers', 'laminate catalog', 'cutlist modules'],
      outputs: ['spatial maps', 'readiness scores', 'cutlist rows', 'provider traces']
    },
    audio: {
      status: 'not-implemented',
      recommendation: 'Add later only if the studio wants voice notes or call transcription.'
    },
    video: {
      status: 'not-implemented',
      recommendation: 'Add later for walkthrough analysis; not needed for the current sales workflow.'
    }
  };

  return {
    systemName: 'Spacious Venture Studio OS multimodal layer',
    isMultimodalSystem: true,
    maturity: providers.clientSafeLiveReady ? 'operational-v1' : 'partial-needs-live-image-provider',
    summary: 'The studio software combines text intake, floor-plan/reference images, PDFs, structured layout data, and generated render outputs. Audio/video are intentionally out of scope for V1.',
    modalities,
    providerStatus: {
      promptRefinement: providers.promptRefinement,
      clientSafeLiveReady: providers.clientSafeLiveReady,
      generationPriority: providers.generationPriority,
      openaiPlatformImageReady: isNativeOpenAiKey(process.env.OPENAI_API_KEY),
      openaiKeyType: providers.openai?.configuredKeyType,
      draftOnlyProviders: providers.draftOnlyProviders
    },
    productBoundary: {
      publicWebsite: {
        path: 'public-website/',
        role: 'public lead-generation website for spaciousventure.com',
        deployTarget: 'static hosting such as GoDaddy, Cloudflare Pages, or Vercel static',
        servedByStudioApp: false,
        present: fs.existsSync(publicWebsitePath)
      },
      studioSoftware: {
        paths: ['frontend/', 'server/', 'storage/', 'docs/'],
        role: 'internal operating software for onboarding, render review, PDFs, cutlists, and reusable memory',
        deployTarget: 'private/local-first app behind STUDIO_ACCESS_TOKEN when exposed',
        present: fs.existsSync(studioBuildPath) || fs.existsSync(path.join(rootDir, 'frontend'))
      }
    },
    recommendedImplementationPath: [
      'Keep public website static and separate from the studio app.',
      'Use this status contract as the source of truth for multimodal readiness.',
      'Route future image, PDF, and text model calls through one multimodal orchestration service instead of adding provider logic inside screens.',
      'Add audio/video only after the core floor-plan-to-render workflow is stable.'
    ]
  };
}
