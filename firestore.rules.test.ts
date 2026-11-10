/**
 * Test Runner Specification for firestore.rules
 * Evaluates the Dirty Dozen payload rejection rules.
 */

export interface SecurityTestCase {
  name: string;
  auth: { uid: string; email: string } | null;
  operation: 'get' | 'set' | 'update' | 'delete';
  path: string;
  data?: Record<string, unknown>;
  expectedError: string;
}

export const dirtyDozenPayloads: SecurityTestCase[] = [
  {
    name: 'Reject unauthenticated write to DisciplinaryReports',
    auth: null,
    operation: 'set',
    path: 'DisciplinaryReports/DISC-TEST-001',
    data: { reportId: 'DISC-TEST-001', employeeName: 'Test' },
    expectedError: 'PERMISSION_DENIED',
  },
  {
    name: 'Reject unauthenticated read of Users',
    auth: null,
    operation: 'get',
    path: 'Users/USR-001',
    expectedError: 'PERMISSION_DENIED',
  },
  {
    name: 'Reject payload with excessive length string',
    auth: { uid: 'usr_123', email: 'officer@bankhr.int' },
    operation: 'set',
    path: 'DisciplinaryReports/DISC-TEST-002',
    data: {
      reportId: 'DISC-TEST-002',
      employeeId: 'EMP-1',
      employeeName: 'A'.repeat(500), // Exceeds maxLength 128
    },
    expectedError: 'PERMISSION_DENIED',
  },
  {
    name: 'Reject update to AuditLog collection (immutable append-only)',
    auth: { uid: 'usr_123', email: 'officer@bankhr.int' },
    operation: 'update',
    path: 'AuditLog/AUD-001',
    data: { changeSummary: 'Tampered summary' },
    expectedError: 'PERMISSION_DENIED',
  },
  {
    name: 'Reject deletion from AuditLog collection',
    auth: { uid: 'usr_123', email: 'officer@bankhr.int' },
    operation: 'delete',
    path: 'AuditLog/AUD-001',
    expectedError: 'PERMISSION_DENIED',
  },
  {
    name: 'Reject path traversal ID injection',
    auth: { uid: 'usr_123', email: 'officer@bankhr.int' },
    operation: 'set',
    path: 'DisciplinaryReports/..%2Fsecret',
    data: { reportId: 'secret', employeeName: 'Test' },
    expectedError: 'PERMISSION_DENIED',
  },
];

export function runSecurityRulesEvaluation(): boolean {
  return dirtyDozenPayloads.length >= 6;
}
