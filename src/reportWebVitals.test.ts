import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import reportWebVitals from './reportWebVitals.js';

vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
}));

const reporters = [onCLS, onFCP, onINP, onLCP, onTTFB];

describe('reportWebVitals', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not register metrics without a callback', () => {
    reportWebVitals();
    reporters.forEach((reporter) => expect(reporter).not.toHaveBeenCalled());
  });

  it('registers all supported metrics, including INP, with the callback', async () => {
    const callback = vi.fn();
    reportWebVitals(callback);
    await vi.waitFor(() => {
      reporters.forEach((reporter) => expect(reporter).toHaveBeenCalledWith(callback));
    });
  });
});
