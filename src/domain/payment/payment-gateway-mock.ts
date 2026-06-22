import { randomUUID } from 'crypto';

export interface PaymentMockResult {
  approved: boolean;
  providerRef: string;
  reason: string;
}

const APPROVAL_THRESHOLD = 1000;

export function simulatePayment(amount: number): PaymentMockResult {
  const approved = amount <= APPROVAL_THRESHOLD;
  return {
    approved,
    providerRef: randomUUID(),
    reason: approved
      ? 'Pagamento aprovado pelo gateway simulado.'
      : `Pagamento recusado pelo gateway simulado: valor (R$ ${amount.toFixed(2)}) acima do limite de R$ ${APPROVAL_THRESHOLD.toFixed(2)}.`,
  };
}
