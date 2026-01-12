export interface SendPushRequest {
  userId: string;
  title: string;
  body: string;
}

export interface PushToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  isEnabled: boolean;
  deviceId?: string | null;
}

export interface SendPushResponse {
  success: boolean;
  sent: number;
  failed: number;
  skipped: number;
  notImplemented: number;
  errors?: Array<{ platform: string; error: string }>;
}
