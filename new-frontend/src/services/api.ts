import { Document, ComplexityLevel, ImageDescription, PipelineMetrics } from '../types/domain';

export type Result<T, E = ApiError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
}

export interface SystemStatusResponse {
  activeStreams: number;
  asrLatencyMs: number;
  islLagMs: number;
  avatarFps: number;
  cpuUsagePct: number;
  metrics: PipelineMetrics;
}

export interface SimplifyRequest {
  text: string;
  targetLevel: ComplexityLevel;
}

export interface SimplifyResponse {
  originalText: string;
  simplifiedText: string;
  complexityLevel: ComplexityLevel;
  glossary: { word: string; definition: string }[];
}

export interface DescribeImageRequest {
  imageUrl: string;
  contextSubject?: string;
}

export interface DescribeImageResponse {
  description: ImageDescription;
}

export interface TtsRequest {
  text: string;
  speed?: number;
  voiceId?: string;
}

export interface TtsResponse {
  audioUrl: string;
  durationSec: number;
  boundaries: { word: string; startMs: number; endMs: number }[];
}

export interface TranscribeAudioRequest {
  audioBlobUrl: string;
  language?: string;
}

export interface TranscribeAudioResponse {
  transcript: string;
  confidence: number;
  segments: { id: string; start: number; end: number; text: string }[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Result<T, ApiError>> {
    try {
      // Dev mode mock check
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown network error');
        return {
          ok: false,
          error: {
            code: `HTTP_${response.status}`,
            message: errorText || `HTTP ${response.status} Request Failed`,
            statusCode: response.status,
          },
        };
      }

      const data = (await response.json()) as T;
      return { ok: true, value: data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network request failed';
      return {
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message,
        },
      };
    }
  }

  // API Methods
  public async startPipeline(sessionId: string): Promise<Result<{ status: string; sessionId: string }>> {
    return this.request<{ status: string; sessionId: string }>('/pipeline/start', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  public async stopPipeline(sessionId: string): Promise<Result<{ status: string }>> {
    return this.request<{ status: string }>('/pipeline/stop', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  public async getStatus(): Promise<Result<SystemStatusResponse>> {
    return this.request<SystemStatusResponse>('/status', { method: 'GET' });
  }

  public async getDocuments(): Promise<Result<Document[]>> {
    return this.request<Document[]>('/documents', { method: 'GET' });
  }

  public async getDocumentById(id: string): Promise<Result<Document>> {
    return this.request<Document>(`/documents/${id}`, { method: 'GET' });
  }

  public async createDocument(docData: Partial<Document>): Promise<Result<Document>> {
    return this.request<Document>('/documents', {
      method: 'POST',
      body: JSON.stringify(docData),
    });
  }

  public async convertDocument(
    id: string,
    targetComplexity: ComplexityLevel
  ): Promise<Result<{ document: Document; aiUsed: boolean; processingMs: number }>> {
    return this.request(`/documents/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify({ targetComplexity }),
    });
  }

  public async generateTts(req: TtsRequest): Promise<Result<TtsResponse>> {
    return this.request<TtsResponse>('/tts', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  public async simplifyText(req: SimplifyRequest): Promise<Result<SimplifyResponse>> {
    return this.request<SimplifyResponse>('/simplify', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  public async describeImage(req: DescribeImageRequest): Promise<Result<DescribeImageResponse>> {
    return this.request<DescribeImageResponse>('/describe-image', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  public async transcribeAudio(req: TranscribeAudioRequest): Promise<Result<TranscribeAudioResponse>> {
    return this.request<TranscribeAudioResponse>('/transcribe', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  // --- Real file upload (multipart) — replaces the JSON-only createDocument
  // for actual PDF/PPTX/image uploads against the document intelligence pipeline.
  public async uploadDocument(file: File): Promise<Result<Document>> {
    const form = new FormData();
    form.append('file', file);
    try {
      const response = await fetch(`${this.baseUrl}/documents`, { method: 'POST', body: form });
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Upload failed');
        return { ok: false, error: { code: `HTTP_${response.status}`, message: errorText, statusCode: response.status } };
      }
      return { ok: true, value: (await response.json()) as Document };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network request failed';
      return { ok: false, error: { code: 'NETWORK_ERROR', message } };
    }
  }

  // --- Dost AI ---
  public async dostChat(req: {
    message: string;
    mode: 'teacher' | 'friend';
    age: number;
    language: 'english' | 'hindi' | 'hinglish';
  }): Promise<Result<{ response: string; available: boolean; warning?: string }>> {
    return this.request('/dost/chat', { method: 'POST', body: JSON.stringify(req) });
  }

  // --- Equations ---
  public async explainEquationPart(req: {
    fullLatex: string;
    selectedPart: string;
    age?: number;
  }): Promise<Result<{ explanation: string; available: boolean }>> {
    return this.request('/equations/explain', {
      method: 'POST',
      body: JSON.stringify({ full_latex: req.fullLatex, selected_part: req.selectedPart, age: req.age ?? 16 }),
    });
  }

  // --- Live classroom ---
  public async createClassroomRoom(): Promise<Result<{ roomId: string }>> {
    return this.request('/classroom/rooms', { method: 'POST' });
  }
}

export const api = new ApiClient();
