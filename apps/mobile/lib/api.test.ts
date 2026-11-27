import { ApiError, apiGet } from './api';

function mockFetch(status: number, json: () => Promise<unknown>) {
  global.fetch = jest.fn().mockResolvedValue({ ok: status < 400, status, json });
}

describe('apiGet', () => {
  it('returns the data field', async () => {
    mockFetch(200, async () => ({ data: { status: 'ok' } }));
    await expect(apiGet('/health')).resolves.toEqual({ status: 'ok' });
  });

  it('throws the server error code and message', async () => {
    mockFetch(503, async () => ({
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Database unavailable' },
    }));
    await expect(apiGet('/health')).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Database unavailable',
      status: 503,
    });
  });

  it('throws ApiError for a non-JSON failure', async () => {
    mockFetch(502, async () => {
      throw new SyntaxError('Unexpected token');
    });
    await expect(apiGet('/health')).rejects.toBeInstanceOf(ApiError);
  });
});
