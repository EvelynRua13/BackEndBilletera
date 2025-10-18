import { jest } from '@jest/globals';

function createMockConnection() {
  return {
    beginTransaction: jest.fn(),
    query: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  };
}

describe('transactionService', () => {
  let mockConnection;
  let runInTransaction;
  let ensureSufficientFunds;
  let insertTransactionRecord;
  let changeBalance;

  beforeEach(async () => {
    // reset module registry so each test can install its own mock
    jest.resetModules();
    mockConnection = createMockConnection();
    // default DB mock: getConnection resolves to our mock connection
    jest.unstable_mockModule('../database/database.js', () => ({
      getConnection: jest.fn(() => Promise.resolve(mockConnection)),
    }));

    // import the service after mocking
    const mod = await import('../utils/transactionService.js');
    runInTransaction = mod.runInTransaction;
    ensureSufficientFunds = mod.ensureSufficientFunds;
    insertTransactionRecord = mod.insertTransactionRecord;
    changeBalance = mod.changeBalance;
  });

  it('commits when handler succeeds', async () => {
    mockConnection.query.mockResolvedValueOnce([[{ saldo: 100 }]]); // not used here but safe
    const handler = jest.fn(async (conn) => {
      expect(conn).toBe(mockConnection);
      return 'ok';
    });

    const res = await runInTransaction(handler);
    expect(res).toBe('ok');
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.rollback).not.toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();
  });

  it('rolls back and rethrows when handler throws', async () => {
    const handler = jest.fn(async () => {
      throw new Error('handler failed');
    });

    await expect(runInTransaction(handler)).rejects.toThrow('handler failed');
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();
  });

  it('ensureSufficientFunds throws when account not found', async () => {
    mockConnection.query.mockResolvedValueOnce([[]]);
    await expect(ensureSufficientFunds(mockConnection, '999', 50)).rejects.toThrow('Cuenta de origen no encontrada.');
  });

  it('ensureSufficientFunds throws when insufficient funds', async () => {
    mockConnection.query.mockResolvedValueOnce([[{ saldo: 10 }]]);
    await expect(ensureSufficientFunds(mockConnection, '200', 50)).rejects.toThrow('Fondos insuficientes en la cuenta origen.');
  });

  it('insertTransactionRecord and changeBalance call query with correct params', async () => {
    mockConnection.query.mockResolvedValue({});
    await insertTransactionRecord(mockConnection, 5, 'retiro', 25, '2025-10-18');
    expect(mockConnection.query).toHaveBeenCalledWith(
      'INSERT INTO transacciones (cuenta_id, tipo, monto, fecha) VALUES (?, ?, ?, ?)',
      [5, 'retiro', 25, '2025-10-18']
    );

    await changeBalance(mockConnection, '200', -25);
    expect(mockConnection.query).toHaveBeenCalledWith('UPDATE usuarios SET saldo = saldo + ? WHERE numero_cuenta = ?', [
      -25,
      '200',
    ]);
  });
});
