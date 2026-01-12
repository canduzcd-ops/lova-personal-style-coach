import { describe, it, expect } from 'vitest';

// Importing directly; env vars are undefined so gateway config is missing
import { analyzeImage } from '../services/aiService';

const USER_MESSAGE = 'Asistan şu an yanıt veremedi, lütfen tekrar deneyin.';

describe('aiService', () => {
  it('throws user-facing error when gateway config missing', async () => {
    await expect(analyzeImage('data:image/png;base64,abc')).rejects.toThrow(USER_MESSAGE);
  });
});
