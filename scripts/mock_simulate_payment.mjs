#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-undef */
// Mock script to simulate the frontend `simulatePayment` call
// Usage: node scripts/mock_simulate_payment.mjs [payment_id] [plan]

const paymentId = process.argv[2] || 'mock_payment_123';
const plan = process.argv[3] || 'monthly';

async function mockInvoke(functionName, { body } = {}) {
  console.log(`Invoking mock function: ${functionName}`);
  console.log('Request body:', JSON.stringify(body, null, 2));

  // Only handle simulate-payment for this mock
  if (functionName === 'simulate-payment') {
    // simulate some validation and return success
    if (!body || !body.payment_id) {
      return { data: { success: false, error: 'payment_id missing' }, error: null };
    }

    // pretend processing delay
    await new Promise((r) => setTimeout(r, 300));

    return { data: { success: true, simulated_payment_id: body.payment_id, plan: body.plan_type || plan }, error: null };
  }

  return { data: null, error: { message: 'function not implemented in mock' } };
}

(async function main() {
  console.log('--- Mock simulate-payment test ---');
  try {
    const { data, error } = await mockInvoke('simulate-payment', { body: { payment_id: paymentId, plan_type: plan } });

    if (error) {
      console.error('Mock returned error:', error);
      process.exitCode = 2;
      return;
    }

    if (data?.success) {
      console.log(`Simulation succeeded for payment_id=${paymentId}. Redirect target: /assinatura?success=true&simulation=true`);
    } else {
      console.log('Simulation did not succeed:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exitCode = 1;
  }
})();
