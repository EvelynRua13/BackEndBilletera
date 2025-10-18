import { jest } from '@jest/globals';

describe('logger behavior', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  test('logger.info y warn no imprimen cuando NODE_ENV=test', async () => {
    process.env.NODE_ENV = 'test';
    const logger = await import('../utils/logger.js');
    const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});

    logger.default.info('info');
    logger.default.warn('warn');
    logger.default.error('err');

    expect(spyLog).not.toHaveBeenCalled();
    expect(spyWarn).not.toHaveBeenCalled();
    expect(spyError).toHaveBeenCalled();

    spyLog.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
  });

  test('logger.info y warn imprimen cuando NODE_ENV!=test', async () => {
    process.env.NODE_ENV = 'development';
    const logger = await import('../utils/logger.js');
    const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});

    logger.default.info('info');
    logger.default.warn('warn');
    logger.default.error('err');

    expect(spyLog).toHaveBeenCalled();
    expect(spyWarn).toHaveBeenCalled();
    expect(spyError).toHaveBeenCalled();

    spyLog.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
  });
});
