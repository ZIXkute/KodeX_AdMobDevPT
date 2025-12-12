import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';

type VoiceSearchCallback = (text: string) => void;
type VoiceErrorCallback = (error: string) => void;
type VoiceStateCallback = (isListening: boolean) => void;

class VoiceSearchService {
  private onResultCallback: VoiceSearchCallback | null = null;
  private onErrorCallback: VoiceErrorCallback | null = null;
  private onStateChangeCallback: VoiceStateCallback | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.isInitialized) return;

    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);

    this.isInitialized = true;
  }

  private onSpeechResults(event: SpeechResultsEvent) {
    const results = event.value;
    if (results && results.length > 0) {
      const text = results[0];
      console.log('Voice search result:', text);
      if (this.onResultCallback) {
        this.onResultCallback(text);
      }
    }
  }

  private onSpeechError(event: SpeechErrorEvent) {
    console.error('Voice search error:', event.error);
    if (this.onErrorCallback) {
      this.onErrorCallback(event.error?.message || 'Voice recognition failed');
    }
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(false);
    }
  }

  private onSpeechStart() {
    console.log('Voice search started');
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(true);
    }
  }

  private onSpeechEnd() {
    console.log('Voice search ended');
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(false);
    }
  }

  async startListening(
    onResult: VoiceSearchCallback,
    onError?: VoiceErrorCallback,
    onStateChange?: VoiceStateCallback
  ): Promise<void> {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.onStateChangeCallback = onStateChange || null;

    try {
      await Voice.start('en-US');
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback('Failed to start voice recognition');
      }
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(false);
      }
    }
  }

  async stopListening(): Promise<void> {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
    }
  }

  async cancelListening(): Promise<void> {
    try {
      await Voice.cancel();
    } catch (error) {
      console.error('Failed to cancel voice recognition:', error);
    }
  }

  async destroy(): Promise<void> {
    try {
      await Voice.destroy();
      this.isInitialized = false;
    } catch (error) {
      console.error('Failed to destroy voice recognition:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const available = await Voice.isAvailable();
      return available === 1 || available === true;
    } catch (error) {
      console.error('Failed to check voice availability:', error);
      return false;
    }
  }
}

export const voiceSearchService = new VoiceSearchService();
