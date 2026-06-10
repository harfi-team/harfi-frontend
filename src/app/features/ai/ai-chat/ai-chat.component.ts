import {
  Component, ViewChild, ElementRef,
  AfterViewChecked, ChangeDetectorRef, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiService, AiSessionSummary } from '../ai.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ChatMessage, ConversationMessage, RetrievedCraftsman
} from '../../../core/models/ai.models';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

// ── DTOs ──────────────────────────────────────────────────────
interface Chat3Response {
  showFeedbackQuestion: boolean;
  isComplete: boolean;
  message: string;
  showServicesList: boolean;
  servicesList: string[];
  showCitiesList: boolean;
  citiesList: string[];
  showIntentChoice: boolean;
  solutionSteps: string[];
  showSolvedQuestion: boolean;
  extractedService: string | null;
  extractedCity: string | null;
  extractedCount: number | null;
  problemClarificationAttempts: number;
  followUpState: number;
  lastProblemDescription: string | null;
  result: QueryResult | null;
  latencyMs: number;
    extractedDistrict: string | null;  // ← جديد

}

interface QueryResult {
  answer: string;
  retrievedCraftsmen: RetrievedCraftsman[];
  latencyMs: number;
}

interface Chat3Request {
  messages: ConversationMessage[];
  extractedService: string | null;
  extractedCity: string | null;
  extractedCount: number | null;
  failedServiceAttempts: number;
  failedCityAttempts: number;
  failedCountAttempts: number;
  intent: number;
  problemClarificationAttempts: number;
  followUpState: number;
  lastProblemDescription: string | null;
  solutionSteps: string[];
  userId: number | null;
  sessionId: string;
    extractedDistrict: string | null;  // ← جديد

}

interface ConversationState {
  extractedService: string | null;
  extractedCity: string | null;
  extractedCount: number | null;
  failedServiceAttempts: number;
  failedCityAttempts: number;
  failedCountAttempts: number;
  intent: 0 | 1 | 2;
  problemClarificationAttempts: number;
  followUpState: number;
  lastProblemDescription: string | null;
  solutionSteps: string[];
  extractedDistrict: string | null;  // ← جديد

}

type OptionsType = 'intent' | 'services' | 'cities' | 'steps' | 'solved' | 'feedback' | 'craftsmen';

interface ExtendedChatMessage extends ChatMessage {
  optionsType?: OptionsType;
  options?: string[];
  isDisabled?: boolean;
  craftsmen?: RetrievedCraftsman[];
  detectedService?: string | null;
  detectedCity?: string | null;
    images?: string[];  // ← أضف ده
    audioUrl?: string; // ← رابط الأوديو للبلاير
    _audioPlaying?: boolean;
    _audioProgress?: number;
    _audioDuration?: string;
}

// ── Component ─────────────────────────────────────────────────
@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.css']
})
export class AiChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('msgEnd') private msgEnd!: ElementRef;

  // ── Sidebar / History ─────────────────────────────────
  sidebarOpen = false;
  sessions: AiSessionSummary[] = [];
  sessionsLoading = false;
currentSessionId: string = crypto.randomUUID();
private readonly backendBase = 'https://localhost:5108';
  // ── Chat state ────────────────────────────────────────
  userInput = '';
  isLoading = false;
  selectedImages: File[] = [];
  selectedImagePreviews: string[] = [];
  isRecording = false;
  mediaRecorder: MediaRecorder | null = null;
  recordingTimeLabel = '0:00';
  private recordingTimer: any = null;
  private recordingSeconds = 0;
  private recordCancelled = false;
  recordedChunks: Blob[] = [];
  recordedAudio: Blob | null = null;
  conversationHistory: ConversationMessage[] = [];

  chatMessages: ExtendedChatMessage[] = [this.welcomeMessage()];

  state: ConversationState = this.freshState();

  craftsmen: RetrievedCraftsman[] = [];
  detectedService: string | null = null;
  detectedCity: string | null = null;
  showResults = false;
  lastAnswer = '';
showDeleteConfirm = false;
pendingDeleteId: string | null = null;
  readonly suggestions = [
    { icon: '💧', text: 'حنفية بتقطر' },
    { icon: '⚡', text: 'كهرباء اتقطعت' },
    { icon: '🚪', text: 'باب خشب مكسور' },
    { icon: '❄️', text: 'تكييف مش بيبرد' },
    { icon: '🪟', text: 'شباك زجاج مكسور' },
    { icon: '🧱', text: 'جدار متشقق' },
  ];

  get userId(): number | null { return this.authSvc.getUserId(); }

  constructor(
    private chatSvc: AiService,
    private authSvc: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
      private toastSvc: ErrorHandlerService // ← أضف ده

  ) {}
ngOnInit() {
  console.log('🔍 [AI] userId:', this.userId);
  console.log('🔍 [AI] user:', localStorage.getItem('harfi_user'));
  console.log('🔍 [AI] token:', localStorage.getItem('harfi_access_token'));
  
  const saved = localStorage.getItem('harfi_ai_session');
  if (saved) {
    this.currentSessionId = saved;
    this.openSession(saved);
  }
  this.loadSessions();
}
  private shouldScroll = false;
  ngAfterViewChecked() { if (this.shouldScroll) { this.scrollDown(); this.shouldScroll = false; } }

  // ════════════════════════════════════════════════════════════
  //  HISTORY SIDEBAR
  // ════════════════════════════════════════════════════════════
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    if (this.sidebarOpen) this.loadSessions();
  }

  loadSessions() {
    const uid = this.userId;
    if (!uid) return;
    this.sessionsLoading = true;
    this.chatSvc.getSessions(uid).subscribe({
      next: s => { this.sessions = s; this.sessionsLoading = false; this.cdr.detectChanges(); },
      error: () => { this.sessionsLoading = false; }
    });
  }



// ── الـ method ──
openSession(sessionId: string) {
    localStorage.setItem('harfi_ai_session', sessionId); // ← احفظ

  const uid = this.userId;
  if (!uid) return;
  this.chatSvc.getSessionDetail(uid, sessionId).subscribe({
    next: d => {
      this.currentSessionId = sessionId;
      this.conversationHistory = [];
      this.chatMessages = [this.welcomeMessage()];
      this.state = this.freshState();
      // ← أضف دول
      this.selectedImages = [];
      this.selectedImagePreviews = [];
      this.recordedAudio = null;
      this.userInput = '';

      for (const m of d.messages) {
        const role = m.role as 'user' | 'assistant';

        this.conversationHistory.push({ role, content: m.content });
        this.chatMessages.push({
          role,
          content: m.audio ? '' : (m.content || ''),
          timestamp: new Date(m.createdAt),
          audioUrl: m.audio
            ? (m.audio.startsWith('http') ? m.audio : this.backendBase + m.audio)
            : undefined,
          images: m.images?.length
            ? m.images.map((img: string) => img.startsWith('http') ? img : this.backendBase + img)
            : undefined
        });
      }

      this.sidebarOpen = false;
      this.cdr.detectChanges();
    },
    error: () => {
      // لو مش موجود في الـ DB، افتحه كشات جديد فاضي
      this.currentSessionId = sessionId;
      this.chatMessages = [this.welcomeMessage()];
      this.conversationHistory = [];
      this.state = this.freshState();
      this.sidebarOpen = false;
      this.cdr.detectChanges();
    }
  });
}
deleteSession(sessionId: string, ev: MouseEvent) {
  ev.stopPropagation();
  const uid = this.userId;
  if (!uid) return;

  // ← Confirm dialog بدل browser confirm
  this.pendingDeleteId = sessionId;
  this.showDeleteConfirm = true;
  this.cdr.detectChanges();
}

confirmDelete() {
  const sessionId = this.pendingDeleteId;
  const uid = this.userId;
  if (!uid || !sessionId) return;
  this.showDeleteConfirm = false;

  this.chatSvc.deleteSession(uid, sessionId).subscribe({
    next: () => {
      this.sessions = this.sessions.filter(s => s.sessionId !== sessionId);
      if (this.currentSessionId === sessionId) this.newChat();
      this.toastSvc.error('🗑️ تم حذف المحادثة');  // ← toast أحمر
      this.cdr.detectChanges();
    },
    error: () => this.toastSvc.error('حصل خطأ أثناء الحذف')
  });
}

cancelDelete() {
  this.showDeleteConfirm = false;
  this.pendingDeleteId = null;
  this.cdr.detectChanges();
}

  newChat() {
    this.currentSessionId = crypto.randomUUID();
      localStorage.setItem('harfi_ai_session', this.currentSessionId); // ← احفظ

    this.conversationHistory = [];
    this.state = this.freshState();
    this.craftsmen = [];
    this.showResults = false;
    this.detectedService = null;
    this.detectedCity = null;
    this.lastAnswer = '';
    this.chatMessages = [this.welcomeMessage()];
    this.sidebarOpen = false;


// ← أضف الـ session الجديد في الـ sidebar فوراً بدون انتظار
  const newSession: AiSessionSummary = {
    sessionId: this.currentSessionId,
    title: 'محادثة جديدة',
    lastMessage: '',
    lastActivity: new Date().toISOString(),
    messageCount: 0
  };
  this.sessions = [newSession, ...this.sessions];

  }

  reset() { this.newChat(); }

  // ════════════════════════════════════════════════════════════
  //  PERSISTENCE
  // ════════════════════════════════════════════════════════════
private persistMessage(role: 'user' | 'assistant', content: string) {
  const uid = this.userId;
  if (!uid || !content?.trim()) return;
  this.chatSvc.saveMessage(uid, this.currentSessionId, role, content).subscribe({
    next: () => {
      // لو user message، استنى شوية عشان الـ LLM يولّد العنوان
      if (role === 'user') {
        setTimeout(() => this.loadSessions(), 2000);
      } else {
        this.loadSessions();
      }
    },
    error: e => console.warn('[AI] save msg failed', e)
  });
}

  // ════════════════════════════════════════════════════════════
  //  USER INTERACTION
  // ════════════════════════════════════════════════════════════
  useSuggestion(text: string) { this.userInput = text; this.send(); }

  onOptionClick(msg: ExtendedChatMessage, option: string) {
    if (msg.isDisabled || this.isLoading) return;
    msg.isDisabled = true;
    this.cdr.detectChanges();

    if (msg.optionsType === 'intent') {
      if (option === 'craftsman') {
        this.state.intent = 1;
        this.state.problemClarificationAttempts = 0;
        this.addUserMessage('👷 عاوز فني متخصص');
      } else {
        this.state.intent = 2;
        this.state.problemClarificationAttempts = 0;
        this.addUserMessage('🔧 عاوز خطوات حل المشكلة');
      }
      this.sendRequest();
    } else if (msg.optionsType === 'services') {
      this.state.extractedService = null;
      this.addUserMessage(option);
      this.sendRequest();
    } else if (msg.optionsType === 'cities') {
      this.addUserMessage(option);
      this.sendRequest();
    } else if (msg.optionsType === 'solved') {
      const ans = option === 'yes' ? 'أيوه، اتحلت ✅' : 'لا، لسه موجودة ❌';
      this.addUserMessage(ans);
      this.sendRequest();
    } else if (msg.optionsType === 'feedback') {
      this.addUserMessage(option === 'helpful' ? 'نعم، كانت مفيدة ✅' : 'لا، لم تكن مفيدة ❌');
      this.sendRequest();
    }
  }

  findCraftsman() {
    this.state.intent = 1;
    this.state.problemClarificationAttempts = 0;
    this.addUserMessage('👷 عاوز فني متخصص');
    this.sendRequest();
  }

  send() {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    if (this.state.extractedService && this.state.intent === 0) {
      if (this.isWantsStepsMessage(text)) {
        this.state.intent = 2;
        this.state.followUpState = 0;
        this.state.lastProblemDescription = null;
        this.state.problemClarificationAttempts = 1;
      }
    }

    this.addUserMessage(text);
    this.userInput = '';
    this.sendRequest();
  }

  private isWantsStepsMessage(text: string): boolean {
    const t = text.trim().toLowerCase();
    return ['خطوات','خطوه','حل','اصلح','أصلح','ازاي','إزاي','كيف',
            'طريقة','طريقه','ساعدني','ساعدنى','لسه','لسا','لا زال',
            'ما زال','مش اتحل','ما اتحلت','موجوده','موجودة','مستمر','مستمره']
      .some(kw => t.includes(kw));
  }

  private addUserMessage(text: string) {
    this.shouldScroll = true;

    this.chatMessages.push({ role: 'user', content: text, timestamp: new Date() });
    this.conversationHistory.push({ role: 'user', content: text });
    this.persistMessage('user', text);   // ← حفظ في الـ DB
    this.cdr.detectChanges();
  }

  // ════════════════════════════════════════════════════════════
  //  REQUESTS
  // ════════════════════════════════════════════════════════════
  private sendRequest() {
    this.isLoading = true;
    this.shouldScroll = true;

    this.chatMessages.push({ role: 'assistant', content: '', isLoading: true, timestamp: new Date() });
    this.cdr.detectChanges();

    const request: Chat3Request = {
      messages: this.conversationHistory,
      extractedService: this.state.extractedService,
      extractedCity: this.state.extractedCity,
      extractedCount: this.state.extractedCount,
      failedServiceAttempts: this.state.failedServiceAttempts,
      failedCityAttempts: this.state.failedCityAttempts,
      failedCountAttempts: this.state.failedCountAttempts,
      intent: this.state.intent,
      problemClarificationAttempts: this.state.problemClarificationAttempts,
      followUpState: this.state.followUpState,
      lastProblemDescription: this.state.lastProblemDescription,
      solutionSteps: this.state.solutionSteps,
      userId: this.userId,
      sessionId: this.currentSessionId,
        extractedDistrict: this.state.extractedDistrict,  // ← جديد

    };

    this.chatSvc.sendChat3(request).subscribe({
      next: r => { this.onResponse(r); this.cdr.detectChanges(); },
      error: () => { this.onError(); this.cdr.detectChanges(); }
    });
  }

  private onResponse(r: Chat3Response) {
    this.chatMessages = this.chatMessages.filter(m => !m.isLoading);
    this.isLoading = false;

    this.state.problemClarificationAttempts = r.problemClarificationAttempts ?? this.state.problemClarificationAttempts;
    this.state.followUpState = r.followUpState ?? this.state.followUpState;
    this.state.lastProblemDescription = r.lastProblemDescription ?? this.state.lastProblemDescription;

    if (r.extractedService) this.state.extractedService = r.extractedService;
    if (r.extractedCity) this.state.extractedCity = r.extractedCity;
    if (r.extractedCount) this.state.extractedCount = r.extractedCount;

    if (this.state.followUpState > 0 || this.state.problemClarificationAttempts > 0)
      this.state.intent = 2;
if (r.extractedDistrict) this.state.extractedDistrict = r.extractedDistrict;

    // ── حفظ رد الـ assistant في الـ DB
    if (r.message) this.persistMessage('assistant', r.message);

    // ── RAG complete ──
    if (r.isComplete && r.result) {
      this.shouldScroll = true;

      this.chatMessages.push({ role: 'assistant', content: r.message, timestamp: new Date() });
      this.conversationHistory.push({ role: 'assistant', content: r.message });
      this.shouldScroll = true;

      this.chatMessages.push({
        role: 'assistant', content: '', timestamp: new Date(),
        optionsType: 'craftsmen',
        craftsmen: r.result.retrievedCraftsmen,
        detectedService: r.extractedService,
        detectedCity: r.extractedCity
      });
      this.lastAnswer = r.result.answer;
      this.showResults = false;
      this.state = this.freshState(r.extractedCity);
      return;
    }

    const inStepsFlow = this.state.intent === 2 || this.state.followUpState > 0
                     || this.state.problemClarificationAttempts > 0;

    if (!inStepsFlow) {
      if (!r.extractedService && !this.state.extractedService) this.state.failedServiceAttempts++;
      if ((r.extractedService || this.state.extractedService)
          && !r.extractedCity && !this.state.extractedCity) this.state.failedCityAttempts++;
    }

    this.conversationHistory.push({ role: 'assistant', content: r.message });

    if (r.showFeedbackQuestion) {
      this.shouldScroll = true;

      this.chatMessages.push({ role: 'assistant', content: r.message, timestamp: new Date() });
      this.shouldScroll = true;

      this.chatMessages.push({
        role: 'assistant', content: 'هل كانت خطوات الحل مفيدة؟ 🤔',
        timestamp: new Date(),
        optionsType: 'feedback', options: ['helpful', 'not_helpful'], isDisabled: false
      });
      this.state.followUpState = 3;
      return;
    }

    if (r.solutionSteps?.length > 0) {
      this.state.solutionSteps = r.solutionSteps;
      this.shouldScroll = true;

      this.chatMessages.push({
        role: 'assistant', content: r.message, timestamp: new Date(),
        optionsType: 'steps', options: r.solutionSteps, isDisabled: false
      });
      this.shouldScroll = true;

      this.chatMessages.push({
        role: 'assistant', content: 'هل تمكّنت الخطوات دي من حل المشكلة؟ 🤔',
        timestamp: new Date(),
        optionsType: 'solved', options: ['yes', 'no'], isDisabled: false
      });
      this.state.followUpState = 1;
      this.state.intent = 2;
      this.state.problemClarificationAttempts = 0;
      return;
    }

    if (r.showSolvedQuestion) {
      this.shouldScroll = true;

      this.chatMessages.push({ role: 'assistant', content: r.message, timestamp: new Date() });
      this.shouldScroll = true;

      this.chatMessages.push({
        role: 'assistant', content: 'هل المشكلة اتحلت؟ 🤔',
        timestamp: new Date(),
        optionsType: 'solved', options: ['yes', 'no'], isDisabled: false
      });
      this.state.followUpState = 1;
      this.state.solutionSteps = r.solutionSteps;
      this.state.intent = 2;
      return;
    }

    if (r.showIntentChoice) {
      this.shouldScroll = true;

      this.chatMessages.push({ role: 'assistant', content: r.message, timestamp: new Date() });
      this.shouldScroll = true;

      this.chatMessages.push({
        role: 'assistant', content: '', timestamp: new Date(),
        optionsType: 'intent', options: ['craftsman', 'steps'], isDisabled: false
      });
      return;
    }

    if (r.showServicesList && r.servicesList?.length > 0) {
      this.shouldScroll = true;

      this.chatMessages.push({ role: 'assistant', content: r.message, timestamp: new Date() });
      this.shouldScroll = true;

      this.chatMessages.push({
        role: 'assistant', content: '', timestamp: new Date(),
        optionsType: 'services', options: r.servicesList, isDisabled: false
      });
      return;
    }

    const isCityQ = r.showCitiesList && r.citiesList?.length > 0
      && (r.extractedService || this.state.extractedService)
      && !r.extractedCity && !this.state.extractedCity;

    if (isCityQ) {
      this.shouldScroll = true;

      this.chatMessages.push({ role: 'assistant', content: r.message, timestamp: new Date() });
      this.shouldScroll = true;

      this.chatMessages.push({
        role: 'assistant', content: '', timestamp: new Date(),
        optionsType: 'cities', options: r.citiesList, isDisabled: false
      });
      return;
    }

    this.shouldScroll = true;


    this.chatMessages.push({ role: 'assistant', content: r.message, timestamp: new Date() });
    if (this.state.followUpState === 0 && this.state.problemClarificationAttempts === 0)
      this.state.intent = 0;
  }

  private onError() {
    this.chatMessages = this.chatMessages.filter(m => !m.isLoading);
    this.isLoading = false;
    this.shouldScroll = true;

    this.chatMessages.push({
      role: 'assistant', content: 'عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.', timestamp: new Date()
    });
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }

  // ════════════════════════════════════════════════════════════
  //  MEDIA
  // ════════════════════════════════════════════════════════════
onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;

  const files = Array.from(input.files); // ← انسخ الـ files فوراً
  input.value = '';                       // ← امسح الـ input بأمان دلوقتي

  for (const file of files) {
    this.selectedImages.push(file);
    const reader = new FileReader();
    reader.onload = () => {
      this.selectedImagePreviews.push(reader.result as string);
      this.cdr.detectChanges(); // ← تأكد إن الـ preview يظهر
    };
    reader.readAsDataURL(file);
  }
}

  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
    this.selectedImagePreviews.splice(index, 1);
  }

  async toggleRecording() {
    if (this.isRecording) { this.stopRecording(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recordedChunks = [];
      this.recordCancelled = false;
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = e => { if (e.data.size > 0) this.recordedChunks.push(e.data); };
      this.mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (this.recordCancelled) { this.recordedChunks = []; this.recordedAudio = null; this.cdr.detectChanges(); return; }
        const webmBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.recordedAudio = await this.convertToWav(webmBlob);
        this.cdr.detectChanges();
      };
      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordingSeconds = 0;
      this.recordingTimeLabel = '0:00';
      this.recordingTimer = setInterval(() => {
        this.recordingSeconds++;
        const m = Math.floor(this.recordingSeconds / 60);
        const s = this.recordingSeconds % 60;
        this.recordingTimeLabel = `${m}:${s.toString().padStart(2, '0')}`;
        this.cdr.detectChanges();
      }, 1000);
      this.cdr.detectChanges();
    } catch { alert('مش قادر أوصل للميكروفون. اتأكد من الصلاحيات.'); }
  }

  private clearRecordingTimer() {
    if (this.recordingTimer) { clearInterval(this.recordingTimer); this.recordingTimer = null; }
  }

  private async convertToWav(webmBlob: Blob): Promise<Blob> {
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const numChannels = 1;
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.getChannelData(0);
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const ws = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    ws(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); ws(8, 'WAVE');
    ws(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true); view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true); ws(36, 'data'); view.setUint32(40, samples.length * 2, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true); offset += 2;
    }
    await audioCtx.close();
    return new Blob([buffer], { type: 'audio/wav' });
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.recordCancelled = false; this.mediaRecorder.stop();
      this.isRecording = false; this.clearRecordingTimer();
    }
  }

  cancelRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.recordCancelled = true; this.mediaRecorder.stop();
      this.isRecording = false; this.clearRecordingTimer(); this.recordedAudio = null;
    }
  }

  removeAudio() { this.recordedAudio = null; }

  // ── WhatsApp-style audio player ──────────────────────────────
  private activeAudioEl: HTMLAudioElement | null = null;
  private activeAudioMsg: ExtendedChatMessage | null = null;

  waveformBars(audioUrl: string): number[] {
    // bars ثابتة بناءً على الـ URL كـ seed عشان يبقوا consistent
    let seed = 0;
    for (let i = 0; i < audioUrl.length; i++) seed += audioUrl.charCodeAt(i);
    const rng = (n: number) => { seed = (seed * 9301 + 49297) % 233280; return (seed / 233280) * n; };
    return Array.from({ length: 30 }, (_, i) => {
      const h = 4 + Math.round(rng(20));
      return h;
    });
  }

  toggleAudio(event: Event, msg: any) {
    const el = (event.currentTarget as HTMLElement)
      .closest('.wa-audio')?.querySelector('audio') as HTMLAudioElement | null;
    if (!el) return;

    // لو في تاني بيشتغل، وقّفه
    if (this.activeAudioEl && this.activeAudioEl !== el) {
      this.activeAudioEl.pause();
      this.activeAudioEl.currentTime = 0;
      if (this.activeAudioMsg) {
        this.activeAudioMsg._audioPlaying = false;
        this.activeAudioMsg._audioProgress = 0;
      }
    }

    if (el.paused) {
      el.play();
      msg._audioPlaying = true;
      this.activeAudioEl = el;
      this.activeAudioMsg = msg;
    } else {
      el.pause();
      msg._audioPlaying = false;
    }
    this.cdr.markForCheck();
  }

  onAudioTimeUpdate(event: Event, msg: any) {
    const el = event.target as HTMLAudioElement;
    if (el.duration) {
      msg._audioProgress = (el.currentTime / el.duration) * 100;
      const rem = el.duration - el.currentTime;
      msg._audioDuration = this.fmtTime(rem);
    }
    this.cdr.markForCheck();
  }

  onAudioEnded(msg: any) {
    msg._audioPlaying = false;
    msg._audioProgress = 0;
    const el = this.activeAudioEl;
    if (el) el.currentTime = 0;
    this.activeAudioEl = null;
    this.activeAudioMsg = null;
    this.cdr.markForCheck();
  }

  onAudioMeta(event: Event, msg: any) {
    const el = event.target as HTMLAudioElement;
    msg._audioDuration = this.fmtTime(el.duration);
    this.cdr.markForCheck();
  }

  seekAudio(event: Event, msg: any) {
    const el = (event.target as HTMLElement)
      .closest('.wa-audio')?.querySelector('audio') as HTMLAudioElement | null;
    if (!el || !el.duration) return;
    const val = +(event.target as HTMLInputElement).value;
    el.currentTime = (val / 100) * el.duration;
    msg._audioProgress = val;
    this.cdr.markForCheck();
  }

  private fmtTime(sec: number): string {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  sendMedia() {
    if (this.selectedImages.length === 0 && !this.recordedAudio) return;
    if (this.isLoading) return;
    const text = this.userInput.trim();
  const imagePreviews = [...this.selectedImagePreviews]; // ← انسخ الـ previews

    let parts: string[] = [];
    if (this.selectedImages.length > 0) parts.push(`📷 ${this.selectedImages.length} صورة`);
    if (this.recordedAudio) parts.push('🎤 تسجيل صوتي');
    if (text) parts.push(text);
    const imgs = [...this.selectedImages];
    const aud = this.recordedAudio;

this.shouldScroll = true;


this.chatMessages.push({
  role: 'user',
  content: text,
  timestamp: new Date(),
  images: imagePreviews,
  audioUrl: aud ? URL.createObjectURL(aud) : undefined
});
    const userText = text || null;

    this.selectedImages = [];
    this.selectedImagePreviews = [];
    this.recordedAudio = null;
    this.userInput = '';

    this.isLoading = true;
    this.shouldScroll = true;

    this.chatMessages.push({ role: 'assistant', content: '', isLoading: true, timestamp: new Date() });

    // الـ backend بيحفظ كل حاجة لوحده في analyze-media
    this.chatSvc.analyzeMedia(
      imgs, aud, userText,
      this.state.extractedService, this.state.extractedCity, this.state.extractedCount,
      this.userId, this.currentSessionId
    ).subscribe({
      next: r => {
        this.onResponseNoSave(r);    // مفيش حفظ تاني — الباك خلصها
        this.loadSessions();
        this.cdr.detectChanges();
      },
      error: () => { this.onError(); this.cdr.detectChanges(); }
    });
  }

  // نفس onResponse لكن بدون persistMessage عشان analyze-media بيحفظ من الـ backend
  private onResponseNoSave(r: Chat3Response) {
    const original = this.persistMessage.bind(this);
    this.persistMessage = () => {};   // عطّل مؤقت
    this.onResponse(r);
    this.persistMessage = original;   // رجّعها
  }

  scrollToTop() {
    const body = document.querySelector('.chat-body');
    if (body) body.scrollTo({ top: 0, behavior: 'smooth' });
  }

  stars(r: number) { return Array(5).fill(0).map((_, i) => i < Math.round(r) ? 1 : 0); }
  scoreColor(s: number) { return s >= 0.8 ? '#22c55e' : s >= 0.6 ? '#f59e0b' : '#ef4444'; }

  private scrollDown() {
    try { this.msgEnd.nativeElement.scrollIntoView({ behavior: 'smooth' }); } catch {}
  }

  goResults() {
    this.router.navigate(['/results'], {
      state: {
        craftsmen: this.craftsmen, detectedService: this.detectedService,
        detectedCity: this.detectedCity, answer: this.lastAnswer
      }
    }).catch(() => {});
  }

  // ════════════════════════════════════════════════════════════
  //  HELPERS
  // ════════════════════════════════════════════════════════════
  private welcomeMessage(): ExtendedChatMessage {
    return {
      role: 'assistant',
      content: 'أهلاً بك! 👋\nأنا مساعدك للعثور على أفضل الحرفيين في مصر.\nأخبرني بمشكلتك وسأجد لك الحرفي المناسب.',
      timestamp: new Date()
    };
  }

  private freshState(city: string | null = null): ConversationState {
    return {
      extractedService: null, extractedCity: city,    extractedDistrict: null,  // ← جديد
 extractedCount: null,
      failedServiceAttempts: 0, failedCityAttempts: 0, failedCountAttempts: 0,
      intent: 0, problemClarificationAttempts: 0, followUpState: 0,
      lastProblemDescription: null, solutionSteps: []
    };
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} د`;
    if (hrs < 24) return `منذ ${hrs} س`;
    if (days < 7) return `منذ ${days} ي`;
    return new Date(dateStr).toLocaleDateString('ar-EG');
  }
}