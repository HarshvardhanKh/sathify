import { globalSocket } from '../services/websocket';
import { Document } from '../types/domain';
import { useAppStore } from '../store/appStore';

// Scripted lecture dataset
const LECTURE_SENTENCES = [
  "Welcome students to today's lecture on Accessible Data Structures and Algorithms.",
  "We will examine how binary search trees store ordered elements efficiently in memory.",
  "When navigating content with a screen reader, hierarchical headings act like tree nodes.",
  "Notice how each node maintains a reference to left and right child subtrees.",
  "In Indian Sign Language, complex algorithmic concepts are expressed through spatial gloss sequences.",
  "Let us now convert this complex mathematical equation into plain spoken text for all learners.",
  "SaathiFy automatically synthesizes multimodal representations for visually and hearing impaired students.",
];

const ISL_GLOSS_MAP: Record<number, string[]> = {
  0: ["WELCOME", "STUDENT", "TODAY", "LECTURE", "ACCESSIBLE", "DATA", "STRUCTURE"],
  1: ["BINARY", "SEARCH", "TREE", "ORDER", "MEMORY", "STORE", "EFFICIENT"],
  2: ["SCREEN-READER", "NAVIGATE", "HEADING", "TREE", "NODE", "SAME"],
  3: ["NODE", "LEFT", "RIGHT", "CHILD", "REFERENCE", "HOLD"],
  4: ["INDIAN", "SIGN-LANGUAGE", "ALGORITHM", "CONCEPT", "SPATIAL", "GLOSS", "EXPRESS"],
  5: ["MATHEMATICAL", "EQUATION", "PLAIN", "TEXT", "SPEAK", "CONVERT"],
  6: ["SAATHIFY", "AUTOMATIC", "MULTIMODAL", "LEARN", "VISUAL", "HEARING", "HELP"],
};

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'doc-1',
    title: 'Computer Architecture & Assembly Basics',
    originalFormat: 'pdf',
    createdAt: '2026-08-20',
    pageCount: 14,
    status: 'ready',
    complexityLevel: 'original',
    subject: 'Computer Science',
    summary: 'Comprehensive study of CPU registers, ALU operations, and memory hierarchy with accessible figures.',
    audioUrl: 'https://example.com/audio/computer-arch.mp3',
    blocks: [
      {
        kind: 'heading',
        id: 'blk-1',
        level: 1,
        text: '1. Introduction to CPU Registers and ALU',
      },
      {
        kind: 'paragraph',
        id: 'blk-2',
        text: 'The Central Processing Unit (CPU) contains high-speed storage locations called registers. The Arithmetic Logic Unit (ALU) executes mathematical computations and boolean logic directly on data stored within these registers.',
        simplifiedText: 'The CPU is the brain of the computer. It has tiny super-fast storage spots called registers. It uses the ALU to do math like addition and comparison.',
        essentialText: 'CPU has fast registers. ALU does math.',
      },
      {
        kind: 'image',
        id: 'blk-3',
        src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
        description: {
          id: 'desc-1',
          shortAlt: 'Diagram showing CPU Register File connected to the Arithmetic Logic Unit and Main RAM bus.',
          longDescription: 'A block diagram illustrating data bus movement. At top left, Register A and Register B feed into two 32-bit input buses. These enter the central V-shaped ALU block. Control signals select addition or bitwise operations. Output flows into an Accumulator register.',
          figureType: 'diagram',
          dataSeries: [
            { label: 'Register Access Latency', value: '0.5 ns' },
            { label: 'L1 Cache Latency', value: '1.2 ns' },
            { label: 'RAM Access Latency', value: '60 ns' },
          ],
          tactileFriendlyNotes: 'Relief diagram has elevated arrows showing data flow clockwise from registers into ALU.',
        },
      },
      {
        kind: 'equation',
        id: 'blk-4',
        latex: 'T_{execution} = I \\times CPI \\times T_{clock}',
        spokenMathText: 'Total Execution Time equals Instruction Count times Cycles Per Instruction times Clock Cycle Time.',
      },
      {
        kind: 'table',
        id: 'blk-5',
        caption: 'Register File Memory Latency Comparison',
        headers: ['Memory Layer', 'Capacity', 'Latency', 'Access Speed Rank'],
        rows: [
          ['Registers', '64 Bytes', '0.5 ns', '1 (Fastest)'],
          ['L1 Cache', '64 KB', '1.2 ns', '2'],
          ['L2 Cache', '512 KB', '4.5 ns', '3'],
          ['Main RAM', '16 GB', '60.0 ns', '4 (Slowest)'],
        ],
      },
    ],
  },
  {
    id: 'doc-2',
    title: 'Introduction to Photosynthesis & Plant Biology',
    originalFormat: 'pptx',
    createdAt: '2026-08-18',
    pageCount: 8,
    status: 'ready',
    complexityLevel: 'simplified',
    subject: 'Biology',
    summary: 'Accessible slide breakdown of light-dependent reactions, Calvin cycle, and chloroplast structure.',
    blocks: [
      {
        kind: 'heading',
        id: 'bio-1',
        level: 1,
        text: 'Photosynthesis: Light to Energy',
      },
      {
        kind: 'paragraph',
        id: 'bio-2',
        text: 'Plants convert sunlight into chemical energy using green pigments called chlorophyll found inside chloroplasts.',
        simplifiedText: 'Plants use sunlight to make food. Green chlorophyll traps light inside plant cells.',
        essentialText: 'Sunlight makes plant food.',
      },
    ],
  },
  {
    id: 'doc-3',
    title: 'Linear Algebra: Vector Spaces & Matrices',
    originalFormat: 'pdf',
    createdAt: '2026-08-15',
    pageCount: 22,
    status: 'ready',
    complexityLevel: 'essential',
    subject: 'Mathematics',
    summary: 'Vector addition, dot products, matrix transformations with spoken math formulas and text descriptions.',
    blocks: [
      {
        kind: 'heading',
        id: 'math-1',
        level: 1,
        text: 'Vector Operations in 3D Space',
      },
      {
        kind: 'paragraph',
        id: 'math-2',
        text: 'A vector represents both magnitude and direction in Euclidean space.',
        simplifiedText: 'A vector is an arrow pointing in a specific direction with a specific length.',
        essentialText: 'Vector = direction + length.',
      },
    ],
  },
];

export class MockLectureServer {
  private timer: number | null = null;
  private currentSentenceIdx = 0;
  private currentWordIdx = 0;
  private isRunning = false;

  public startMockStream(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    useAppStore.getState().setPipelineState('running');

    this.timer = window.setInterval(() => {
      this.tick();
    }, 220);
  }

  public stopMockStream(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    useAppStore.getState().setPipelineState('idle');
  }

  private tick(): void {
    if (!this.isRunning) return;

    const sentence = LECTURE_SENTENCES[this.currentSentenceIdx % LECTURE_SENTENCES.length];
    if (!sentence) return;

    const words = sentence.split(' ');

    if (this.currentWordIdx < words.length) {
      // Emit Partial Transcript
      const partialText = words.slice(0, this.currentWordIdx + 1).join(' ');
      globalSocket.emitMockEvent({
        type: 'TRANSCRIPT_PARTIAL',
        timestamp: Date.now(),
        data: {
          speakerId: 'Prof. Ananya Roy',
          partialText,
          confidence: 0.96,
        },
      });
      useAppStore.getState().setTranscriptPartial(partialText);
      this.currentWordIdx++;
    } else {
      // Emit Final Transcript
      const finalItem = {
        id: `seg-${Date.now()}`,
        speaker: 'Prof. Ananya Roy',
        text: sentence,
        confidence: 0.98,
        timestamp: Date.now(),
      };

      globalSocket.emitMockEvent({
        type: 'TRANSCRIPT_FINAL',
        timestamp: Date.now(),
        data: {
          segmentId: finalItem.id,
          speakerId: finalItem.speaker,
          finalText: sentence,
          startTime: Date.now() - 3500,
          endTime: Date.now(),
          confidence: 0.98,
        },
      });

      useAppStore.getState().addTranscriptFinal(finalItem);

      // Emit ISL Translation 400ms later
      const sentenceIdx = this.currentSentenceIdx % LECTURE_SENTENCES.length;
      const glossTokens = ISL_GLOSS_MAP[sentenceIdx] || ["LECTURE", "EXPLAIN", "LEARN"];

      window.setTimeout(() => {
        const islGloss = {
          id: `isl-${Date.now()}`,
          timestamp: Date.now(),
          text: sentence,
          glossTokens,
          grammarNotes: 'ISL Subject-Object-Verb spatial arrangement',
        };

        globalSocket.emitMockEvent({
          type: 'ISL_TRANSLATION',
          timestamp: Date.now(),
          data: {
            segmentId: finalItem.id,
            originalText: sentence,
            glossTokens,
            grammarNotes: 'ISL Subject-Object-Verb spatial arrangement',
          },
        });

        useAppStore.getState().setIslCurrent(islGloss);
      }, 400);

      // Reset word counter for next sentence
      this.currentWordIdx = 0;
      this.currentSentenceIdx++;

      // Periodic Status Frame
      const statusData = {
        audioActive: true,
        asrLatencyMs: Math.floor(35 + Math.random() * 15),
        translatorLagMs: Math.floor(370 + Math.random() * 30),
        avatarFps: 60,
        cpuUsagePct: Math.floor(14 + Math.random() * 8),
      };

      globalSocket.emitMockEvent({
        type: 'SYSTEM_STATUS',
        timestamp: Date.now(),
        data: statusData,
      });

      useAppStore.getState().updateStatus(statusData);
    }
  }
}

export const mockLectureServer = new MockLectureServer();

// Initialize Mock Library in Store
useAppStore.getState().setLibrary(MOCK_DOCUMENTS);
