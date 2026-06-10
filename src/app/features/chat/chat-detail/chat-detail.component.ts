import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { Subject, debounceTime, firstValueFrom,combineLatest } from 'rxjs';
import { ChatService } from '../chat.service';
import { ChatHubService } from '../../../core/hubs/chat.hub.service';
import { MessageDto } from '../../../core/models/chat.models';
import { TokenService } from '../../../core/services/token.service';
import { environment } from '../../../../environments/environment';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

const PAGE_SIZE = 20;
const FILE_SIZE_LIMIT = 5 * 1024 * 1024;
const VOICE_SIZE_LIMIT = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_RENDERED_MESSAGES = 50;
const VOICE_UI_UPDATE_INTERVAL_MS = 200;
const MARK_AS_READ_DEBOUNCE_MS = 250;

type PendingImage = {
  id: number;
  file: File;
  previewUrl: string;
};

@Component({
  standalone: true,
  selector: 'app-chat-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent,
    RelativeTimePipe
  ],
  templateUrl: './chat-detail.component.html',
  styleUrls: ['./chat-detail.component.css']
})
export class ChatDetailComponent implements OnInit, OnDestroy {
  @ViewChild('messagesArea') private messagesArea!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  private route      = inject(ActivatedRoute);
  private chatService = inject(ChatService);
  private chatHub    = inject(ChatHubService);
  private tokenSvc   = inject(TokenService);
  private router     = inject(Router);
  private location   = inject(Location);
  private destroyRef = inject(DestroyRef);

  readonly currentUserId = this.tokenSvc.getUser()?.id ?? 0;

  readonly conversationId     = signal<number | null>(null);
  readonly conversationName   = signal<string | null>(null);
  readonly otherUserId        = signal<number | null>(null);
  readonly otherUserOnline    = signal(false);
  readonly allMessages        = signal<MessageDto[]>([]);
  readonly loading            = signal(true);
  readonly loadingMore        = signal(false);
  readonly hasMore            = signal(true);
  readonly sending            = signal(false);
  readonly uploadingImage     = signal(false);
  readonly sendError          = signal<string | null>(null);
  readonly isTyping           = signal(false);
  readonly imagePreviewUrl    = signal<string | null>(null);
  readonly showAttachMenu     = signal(false);
  readonly pendingImages      = signal<PendingImage[]>([]);
  readonly confirmDeleteMessageId = signal<number | null>(null);
  readonly deletingFromConfirm = signal(false);

  // ── Voice ──────────────────────────────────────────────────
  readonly isRecording      = signal(false);
  readonly uploadingVoice   = signal(false);
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private readonly voiceDurations = new Map<number, number>();
  private readonly voiceCurrentTimes = new Map<number, number>();
  private readonly voicePlayingStates = new Map<number, boolean>();
  private readonly voiceElements = new Map<number, HTMLAudioElement>();
  private readonly voiceLastUiUpdateAt = new Map<number, number>();
  private currentPlayingVoiceId: number | null = null;

  private page = 1;

  private readonly seenMessageIds = new Set<number>();
  private readonly deletingMessageIds = new Set<number>();
  private readonly typingSubject  = new Subject<number>();
  private readonly scrollTrigger  = new Subject<void>();
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;
  private sendErrorTimer: ReturnType<typeof setTimeout> | null = null;
  private markAsReadTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollToBottomTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollToBottomRafId: number | null = null;
  private scrollAdjustRafId: number | null = null;
  private markAsReadInFlight = false;
  private isDestroyed = false;
  private hasConnected = false;

  readonly messageControl = new FormControl('', [
    Validators.maxLength(2000)
  ]);

  private readonly messageValue = toSignal(this.messageControl.valueChanges, {
    initialValue: this.messageControl.value ?? ''
  });

  readonly canSend = computed(() => {
    const text = this.messageValue()?.trim() ?? '';
    return text.length > 0 || this.pendingImages().length > 0;
  });

  private readonly incomingMessage = toSignal(this.chatHub.message$, {
    initialValue: null as MessageDto | null
  });
  private readonly incomingRead = toSignal(this.chatHub.read$, {
    initialValue: null as { conversationId: number; readerId: number } | null
  });
  private readonly typingFromHub = toSignal(this.chatHub.typing$, {
    initialValue: null as { conversationId: number; userId: number } | null
  });
  private readonly deletedMessageFromHub = toSignal(this.chatHub.deletedMessage$, {
    initialValue: null as { conversationId: number; messageId: number } | null
  });
  

  constructor() {
    effect(() => {
      const msg = this.incomingMessage();
      const id  = this.conversationId();
      if (!msg || msg.conversationId !== id) return;
      if (this.seenMessageIds.has(msg.id)) return;
      this.seenMessageIds.add(msg.id);
      this.allMessages.update(list => this.limitMessages([...list, msg]));
      this.scrollTrigger.next();
      if (msg.senderId !== this.currentUserId) {
        this.scheduleMarkAsRead();
      }
    });

    effect(() => {
      const payload = this.incomingRead();
      const id = this.conversationId();
      if (!payload || payload.conversationId !== id) return;
      if (payload.readerId === this.currentUserId) return;

      this.allMessages.update(list =>
        list.map(m => (m.senderId === this.currentUserId ? { ...m, isRead: true } : m))
      );
    });

    effect(() => {
      const payload = this.typingFromHub();
      const id = this.conversationId();
      if (!payload) return;
      if (payload.conversationId && payload.conversationId !== id) return;
      if (payload.userId === this.currentUserId) return;

      this.isTyping.set(true);
      if (this.typingTimeout) clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => this.isTyping.set(false), 2000);
    });

    effect(() => {
      const payload = this.deletedMessageFromHub();
      const id = this.conversationId();
      if (!payload || payload.conversationId !== id) return;

      this.removeMessageLocally(payload.messageId);
    });

   
  }

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.data])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, data]) => {
        const id = Number(params.get('id'));
        if (id && id !== this.conversationId()) {
          
          const resolved = data['conversation'] as any; 
          if (resolved) {
            this.conversationName.set(resolved.otherUserName);
            const parsedOtherUserId = Number(resolved.otherUserId);
            this.otherUserId.set(parsedOtherUserId);
            
            this.otherUserOnline.set(resolved.isOnline);
          }
          void this.openConversation(id);
        }
      });

    this.typingSubject
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(convId => {
        void this.chatHub.typing(convId);
      });

    this.scrollTrigger
      .pipe(debounceTime(50), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.scrollToBottom());

   this.chatHub.userOnline$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(userId => {
        if (userId && Number(userId) === Number(this.otherUserId())) {
          this.otherUserOnline.set(true);
        }
      });

    this.chatHub.userOffline$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(userId => {
        if (userId && Number(userId) === Number(this.otherUserId())) {
          this.otherUserOnline.set(false);
        }
      });
  }

  // ── Open Conversation ─────────────────────────────────────
 private async openConversation(id: number): Promise<void> {
    const previous = this.conversationId();
    if (previous) {
      await this.chatHub.leaveConversation(previous).catch(() => {});
    }

    if (this.isDestroyed) return;

    this.conversationId.set(id);
    this.page = 1;
    this.hasMore.set(true);
    this.allMessages.set([]);
    this.seenMessageIds.clear();
    this.loading.set(true);

    await this.loadMessages();
    if (this.isDestroyed) return;

    try {
      if (!this.hasConnected) {
        await this.chatHub.connect();
        this.hasConnected = true;
      } else {
        await this.chatHub.connect(false);
      }

      if (this.isDestroyed) {
        this.chatHub.release();
        return;
      }

      await this.chatHub.joinConversation(id);
      await this.chatHub.markAsRead(id);
    } catch {
      this.showError('CHAT.CONNECTION_OFFLINE');
    }
  }

  // ── Load Messages ─────────────────────────────────────────
  private async loadMessages(): Promise<void> {
    const id = this.conversationId();
    if (!id) return;
    try {
      const data = await firstValueFrom(
        this.chatService.getMessages(id, this.page, PAGE_SIZE)
      );
      if (data.length < PAGE_SIZE) this.hasMore.set(false);
      const ordered = data.reverse();
      this.allMessages.set(this.limitMessages(ordered));
      ordered.forEach(m => this.seenMessageIds.add(m.id));
      this.loading.set(false);
      this.scrollToBottomDeferred();
    } catch {
      this.loading.set(false);
    }
  }

  async loadOlderMessages(): Promise<void> {
    if (this.loadingMore() || !this.hasMore()) return;
    const id = this.conversationId();
    if (!id) return;
    this.loadingMore.set(true);
    this.page++;
    const prevScrollHeight = this.messagesArea?.nativeElement?.scrollHeight ?? 0;
    try {
      const data = await firstValueFrom(
        this.chatService.getMessages(id, this.page, PAGE_SIZE)
      );
      if (data.length < PAGE_SIZE) this.hasMore.set(false);
      this.allMessages.update(list => [...data.reverse(), ...list]);
      data.forEach(m => this.seenMessageIds.add(m.id));
      this.scrollAdjustRafId = requestAnimationFrame(() => {
        if (this.isDestroyed) return;
        const el = this.messagesArea?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight - prevScrollHeight;
      });
    } catch {
      this.page--;
    }
    this.loadingMore.set(false);
  }

  onScroll(): void {
    const el = this.messagesArea?.nativeElement;
    if (!el) return;
    if (el.scrollTop < 80) this.loadOlderMessages();
  }

  // ── Send Text ─────────────────────────────────────────────
 async send(event?: Event): Promise<void> {
    event?.preventDefault();

    if (this.sending() || this.messageControl.invalid) return;

    const id = this.conversationId();
    if (!id) return;

    const content = this.messageControl.value?.trim() ?? '';
    const queuedImages = [...this.pendingImages()];

    if (!content && queuedImages.length === 0) return;

    this.sending.set(true);
    this.sendError.set(null);

    let sendingImages = false;

    try {
      await this.ensureConnectedToConversation(id);

      if (content) {
        await this.chatHub.sendMessage({ conversationId: id, content, messageType: 'text' });
      }

      if (queuedImages.length > 0) {
        sendingImages = true;
        this.uploadingImage.set(true);

        for (const image of queuedImages) {
          const { url } = await firstValueFrom(this.chatService.uploadImage(image.file));
          await this.chatHub.sendMessage({ conversationId: id, content: url, messageType: 'image' });
          this.removePendingImage(image.id);
        }
      }

      this.messageControl.reset('');
    } catch {
      this.showError(sendingImages ? 'CHAT.IMAGE_UPLOAD_FAILED' : 'CHAT.SEND_FAILED');
    } finally {
      this.uploadingImage.set(false);
      this.sending.set(false);
    }
  }

  // ── Send Image ────────────────────────────────────────────
  toggleAttachMenu(): void {
    this.showAttachMenu.update(v => !v);
  }

  closeAttachMenu(): void {
    this.showAttachMenu.set(false);
  }

  triggerImageUpload(): void {
    this.closeAttachMenu();
    this.fileInput?.nativeElement?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) return;

    let hasInvalidType = false;
    let hasLargeFile = false;

    const existing = new Set(
      this.pendingImages().map(img => `${img.file.name}-${img.file.size}-${img.file.lastModified}`)
    );

    const validImages: PendingImage[] = [];

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        hasInvalidType = true;
        continue;
      }

      if (file.size > FILE_SIZE_LIMIT) {
        hasLargeFile = true;
        continue;
      }

      const signature = `${file.name}-${file.size}-${file.lastModified}`;
      if (existing.has(signature)) continue;

      existing.add(signature);
      validImages.push({
        id: Date.now() + Math.floor(Math.random() * 10000),
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }

    if (validImages.length > 0) {
      this.pendingImages.update(list => [...list, ...validImages]);
      this.closeAttachMenu();
    }

    if (hasInvalidType) this.showError('CHAT.INVALID_IMAGE_TYPE');
    else if (hasLargeFile) this.showError('CHAT.IMAGE_TOO_LARGE');

    input.value = '';
  }

  removePendingImage(imageId: number): void {
    const image = this.pendingImages().find(img => img.id === imageId);
    if (!image) return;

    URL.revokeObjectURL(image.previewUrl);
    this.pendingImages.update(list => list.filter(img => img.id !== imageId));
  }

  clearPendingImages(): void {
    for (const image of this.pendingImages()) {
      URL.revokeObjectURL(image.previewUrl);
    }
    this.pendingImages.set([]);
  }

  trackByPendingImageId(_index: number, image: PendingImage): number {
    return image.id;
  }

  // ── Send Location ─────────────────────────────────────────
  sendLocation(): void {
    this.closeAttachMenu();
    const id = this.conversationId();
    if (!id) return;

    if (!navigator.geolocation) {
      this.showError('CHAT.LOCATION_NOT_SUPPORTED');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const content = `${latitude},${longitude}`;
        try {
          await this.ensureConnectedToConversation(id);
          await this.chatHub.sendMessage({ conversationId: id, content, messageType: 'location' });
        } catch {
          this.showError('CHAT.SEND_FAILED');
        }
      },
      () => this.showError('CHAT.LOCATION_DENIED')
    );
  }

  // ── Voice Recording ───────────────────────────────────────
  async toggleRecording(): Promise<void> {
    if (this.isRecording()) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        this.uploadVoice();
      };

      this.mediaRecorder.start();
      this.isRecording.set(true);

    } catch {
      this.showError('CHAT.MIC_DENIED');
    }
  }

  private stopRecording(): void {
    this.mediaRecorder?.stop();
    this.isRecording.set(false);
  }

  private async uploadVoice(): Promise<void> {
    const id = this.conversationId();
    if (!id || this.audioChunks.length === 0) return;

    const blob = new Blob(this.audioChunks, { type: 'audio/webm' });

    if (blob.size > VOICE_SIZE_LIMIT) {
      this.showError('CHAT.VOICE_TOO_LARGE');
      return;
    }

    const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });

    this.uploadingVoice.set(true);
    try {
      const { url } = await firstValueFrom(this.chatService.uploadVoice(file));
      await this.ensureConnectedToConversation(id);
      await this.chatHub.sendMessage({ conversationId: id, content: url, messageType: 'voice' });
    } catch {
      this.showError('CHAT.VOICE_UPLOAD_FAILED');
    }
    this.uploadingVoice.set(false);
  }

  // ── Helpers ───────────────────────────────────────────────
  getLocationUrl(content: string): string {
    return `https://www.google.com/maps?q=${content}`;
  }

  toggleVoicePlayback(messageId: number, audio: HTMLAudioElement): void {
    this.voiceElements.set(messageId, audio);

    const msg = this.allMessages().find(m => m.id === messageId);

    if (this.currentPlayingVoiceId !== null && this.currentPlayingVoiceId !== messageId) {
      const currentAudio = this.voiceElements.get(this.currentPlayingVoiceId);
      currentAudio?.pause();
      this.voicePlayingStates.set(this.currentPlayingVoiceId, false);
    }

    if (audio.paused) {
      audio.play().catch(() => {
        this.voicePlayingStates.set(messageId, false);
      });
      this.currentPlayingVoiceId = messageId;
      this.voicePlayingStates.set(messageId, true);

      if (msg && msg.senderId !== this.currentUserId) {
        this.scheduleMarkAsRead();
      }
    } else {
      audio.pause();
      this.voicePlayingStates.set(messageId, false);
      if (this.currentPlayingVoiceId === messageId) {
        this.currentPlayingVoiceId = null;
      }
    }
  }

  onVoiceLoadedMetadata(messageId: number, audio: HTMLAudioElement): void {
    this.voiceElements.set(messageId, audio);
    this.voiceDurations.set(messageId, Number.isFinite(audio.duration) ? audio.duration : 0);
  }

  onVoiceTimeUpdate(messageId: number, audio: HTMLAudioElement): void {
    const now = performance.now();
    const lastUpdate = this.voiceLastUiUpdateAt.get(messageId) ?? 0;
    if (now - lastUpdate < VOICE_UI_UPDATE_INTERVAL_MS) return;

    this.voiceLastUiUpdateAt.set(messageId, now);
    this.voiceCurrentTimes.set(messageId, audio.currentTime || 0);
    this.voiceDurations.set(messageId, Number.isFinite(audio.duration) ? audio.duration : 0);
  }

  onVoiceEnded(messageId: number): void {
    this.voicePlayingStates.set(messageId, false);
    this.voiceCurrentTimes.set(messageId, 0);
    this.voiceLastUiUpdateAt.delete(messageId);
    if (this.currentPlayingVoiceId === messageId) {
      this.currentPlayingVoiceId = null;
    }
  }

  seekVoice(messageId: number, audio: HTMLAudioElement, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    audio.currentTime = Number.isFinite(value) ? value : 0;
    this.voiceCurrentTimes.set(messageId, audio.currentTime);
  }

  getVoiceDuration(messageId: number): number {
    return this.voiceDurations.get(messageId) ?? 0;
  }

  getVoiceCurrentTime(messageId: number): number {
    return this.voiceCurrentTimes.get(messageId) ?? 0;
  }

  isVoicePlaying(messageId: number): boolean {
    return this.voicePlayingStates.get(messageId) ?? false;
  }

  getVoiceProgressPercent(messageId: number): number {
    const duration = this.getVoiceDuration(messageId);
    if (!duration) return 0;
    return (this.getVoiceCurrentTime(messageId) / duration) * 100;
  }

  formatAudioTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
    const total = Math.floor(seconds);
    const m = Math.floor(total / 60).toString().padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  onTyping(): void {
    const id = this.conversationId();
    if (id) this.typingSubject.next(id);
  }

  isMine(msg: MessageDto): boolean {
    return !!this.currentUserId && msg.senderId === this.currentUserId;
  }

  trackById(_index: number, msg: MessageDto): number {
    return msg.id;
  }

  initials(name: string | null | undefined): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  resolveImageUrl(url: string): string {
    if (!url || url.startsWith('http://') || url.startsWith('https://')) return url;
    const base   = environment.apiBaseUrl;
    const origin = base.substring(0, base.lastIndexOf('/api'));
    return `${origin}${url}`;
  }

  onMessageImageLoad(): void {
    if (this.isNearBottom()) this.scrollTrigger.next();
  }

  imgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  openImagePreview(url: string): void {
    this.imagePreviewUrl.set(url);
  }

  closeImagePreview(): void {
    this.imagePreviewUrl.set(null);
  }

  requestDeleteMessage(messageId: number): void {
    if (this.deletingMessageIds.has(messageId)) return;
    this.confirmDeleteMessageId.set(messageId);
  }

  cancelDeleteMessage(): void {
    this.confirmDeleteMessageId.set(null);
    this.deletingFromConfirm.set(false);
  }

  async confirmDeleteMessage(): Promise<void> {
    const messageId = this.confirmDeleteMessageId();
    if (!messageId) return;

    this.deletingFromConfirm.set(true);
    await this.deleteMessage(messageId);
    this.deletingFromConfirm.set(false);
  }

  async deleteMessage(messageId: number): Promise<void> {
    const id = this.conversationId();
    if (!id || this.deletingMessageIds.has(messageId)) return;

    this.deletingMessageIds.add(messageId);

    try {
      await this.ensureConnectedToConversation(id);
      await this.chatHub.deleteMessage(id, messageId);
      this.confirmDeleteMessageId.set(null);
    } catch {
      try {
        await firstValueFrom(this.chatService.deleteMessage(id, messageId));
        this.removeMessageLocally(messageId);
        this.confirmDeleteMessageId.set(null);
      } catch {
        this.showError('CHAT.DELETE_FAILED');
      }
    } finally {
      this.deletingMessageIds.delete(messageId);
    }
  }

  goBack(): void {
    this.location.back();
  }

 ngOnDestroy(): void {
    this.isDestroyed = true;

    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    if (this.sendErrorTimer) clearTimeout(this.sendErrorTimer);
    if (this.markAsReadTimer) clearTimeout(this.markAsReadTimer);
    this.clearScrollDeferredTimers();

    if (this.mediaRecorder && this.isRecording()) {
      try { this.mediaRecorder.stop(); } catch {}
    }
    this.voiceElements.forEach(audio => {
      try { audio.pause(); audio.src = ''; } catch {}
    });
    this.voiceElements.clear();
    this.clearPendingImages();

    this.teardownRealtime();
    
    if (this.hasConnected) {
      this.chatHub.release();
    }
  }

  private teardownRealtime(): void {
    const id = this.conversationId();

    if (id) {
      this.chatHub.leaveConversation(id).catch(() => {});
    }
  }

 private async ensureConnectedToConversation(id: number): Promise<void> {
    if (!this.chatHub.isConnected()) {
      await this.chatHub.connect();
      this.hasConnected = true;
    }
    await this.chatHub.joinConversation(id);
  }

  private scheduleMarkAsRead(): void {
    const id = this.conversationId();
    if (!id || this.markAsReadInFlight || this.markAsReadTimer) return;

    this.markAsReadTimer = setTimeout(() => {
      this.markAsReadTimer = null;
      void this.flushMarkAsRead(id);
    }, MARK_AS_READ_DEBOUNCE_MS);
  }

  private async flushMarkAsRead(conversationId: number): Promise<void> {
    if (this.markAsReadInFlight) return;

    this.markAsReadInFlight = true;
    try {
      await this.chatHub.markAsRead(conversationId);
    } catch {
      // no-op
    } finally {
      this.markAsReadInFlight = false;
    }
  }

  private showError(key: string): void {
    this.sendError.set(key);
    if (this.sendErrorTimer) clearTimeout(this.sendErrorTimer);
    this.sendErrorTimer = setTimeout(() => {
      if (this.isDestroyed) return;
      this.sendError.set(null);
    }, 3000);
  }

  private scrollToBottomDeferred(): void {
    this.clearScrollDeferredTimers();

    this.scrollToBottomRafId = requestAnimationFrame(() => {
      if (this.isDestroyed) return;
      this.scrollToBottom();

      this.scrollToBottomTimer = setTimeout(() => {
        if (this.isDestroyed) return;
        this.scrollToBottom();
      }, 120);
    });
  }

  isDeletingMessage(messageId: number): boolean {
    return this.deletingMessageIds.has(messageId);
  }

  private removeMessageLocally(messageId: number): void {
    this.allMessages.update(list => list.filter(m => m.id !== messageId));
    this.seenMessageIds.delete(messageId);
    const audio = this.voiceElements.get(messageId);
    if (audio) {
      audio.pause();
      this.voiceElements.delete(messageId);
    }
    this.voiceDurations.delete(messageId);
    this.voiceCurrentTimes.delete(messageId);
    this.voicePlayingStates.delete(messageId);
    this.voiceLastUiUpdateAt.delete(messageId);
    if (this.currentPlayingVoiceId === messageId) {
      this.currentPlayingVoiceId = null;
    }
  }

  private limitMessages(messages: MessageDto[]): MessageDto[] {
    if (messages.length <= MAX_RENDERED_MESSAGES) return messages;
    return messages.slice(messages.length - MAX_RENDERED_MESSAGES);
  }

  private isNearBottom(threshold = 140): boolean {
    const el = this.messagesArea?.nativeElement;
    if (!el) return false;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  }

  private scrollToBottom(): void {
    const el = this.messagesArea?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  private clearScrollDeferredTimers(): void {
    if (this.scrollToBottomTimer) {
      clearTimeout(this.scrollToBottomTimer);
      this.scrollToBottomTimer = null;
    }

    if (this.scrollToBottomRafId !== null) {
      cancelAnimationFrame(this.scrollToBottomRafId);
      this.scrollToBottomRafId = null;
    }

    if (this.scrollAdjustRafId !== null) {
      cancelAnimationFrame(this.scrollAdjustRafId);
      this.scrollAdjustRafId = null;
    }
  }
}