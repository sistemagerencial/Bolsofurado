#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-undef */
// Mock full flow: create card token, get payment method, call create-payment
// Usage: node scripts/mock_create_payment_flow.mjs [cardNumber] [cardName] [expMonth] [expYear] [cvv] [cpf] [email] [userId] [plan]

const [,, cardNumberArg, cardNameArg, expMonthArg, expYearArg, cvvArg, cpfArg, emailArg, userIdArg, planArg] = process.argv;

const cardNumber = cardNumberArg || '4111 1111 1111 1111';
const cardName = cardNameArg || 'JOAO SILVA';
const expMonth = expMonthArg || '12';
const expYear = expYearArg || '2030';
const cvv = cvvArg || '123';
const cpf = cpfArg || '123.456.789-09';
const email = emailArg || 'user@example.com';
const userId = userIdArg || 'user_mock_1';
const plan = planArg || 'monthly';

function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

async function mockCreateCardToken({ cardNumber, cardholderName, cardExpirationMonth, cardExpirationYear, securityCode, identificationType, identificationNumber }) {
  console.log('Mock MercadoPago.createCardToken called with:', { cardNumber, cardholderName, cardExpirationMonth, cardExpirationYear, securityCode, identificationType, identificationNumber });
  await new Promise(r => setTimeout(r, 150));
  return { id: randomId('card_tok') };
}

async function mockGetPaymentMethod({ bin }) {
  console.log('Mock MercadoPago.getPaymentMethod called with bin:', bin);
  await new Promise(r => setTimeout(r, 120));
  // Simple mock: visa if starts with 4, mastercard 5, else generic
  const brand = bin.startsWith('4') ? 'visa' : bin.startsWith('5') ? 'master' : 'unknown';
  return {
    results: [
      {
        id: brand,
        issuer: { id: brand === 'unknown' ? '999' : '111' }
      }
    ]
  };
}

async function mockInvokeCreatePayment(body) {
  console.log('Mock invoking edge function create-payment with body:');
  console.log(JSON.stringify(body, null, 2));
  await new Promise(r => setTimeout(r, 200));

  // Basic validation to mimic backend requirements
  if (!body.user_id) return { error: 'missing user_id' };
  if (!body.token) return { error: 'missing token' };
  if (!body.payer?.payment_method_id || !body.payer?.issuer_id) return { error: 'missing payment_method_id or issuer_id' };

  return { data: { status: 'approved', payment_id: randomId('pay') } };
}

(async function main() {
  console.log('--- Mock Create Payment Flow ---');
  try {
    // create token
    const cardToken = await mockCreateCardToken({
      cardNumber: cardNumber.replace(/\s/g, ''),
      cardholderName: cardName,
      cardExpirationMonth: expMonth,
      cardExpirationYear: expYear,
      securityCode: cvv,
      identificationType: 'CPF',
      identificationNumber: cpf.replace(/\D/g, ''),
    });

    console.log('Card token created:', cardToken.id);

    // get payment method by BIN
    const bin = cardNumber.replace(/\s/g, '').substring(0, 6);
    const paymentMethodInfo = await mockGetPaymentMethod({ bin });
    const payment_method_id = paymentMethodInfo?.results?.[0]?.id;
    const issuer_id = paymentMethodInfo?.results?.[0]?.issuer?.id;

    console.log('Payment method info:', { payment_method_id, issuer_id });

    // call create-payment
    const body = {
      user_id: userId,
      plan,
      payment_method: 'credit_card',
      token: cardToken.id,
      installments: 1,
      payer: {
        email,
        first_name: cardName.split(' ')[0],
        last_name: cardName.split(' ').slice(1).join(' '),
        identification: { type: 'CPF', number: cpf.replace(/\D/g, '') },
        payment_method_id,
        issuer_id,
      }
    };

    const result = await mockInvokeCreatePayment(body);

    if (result.error) {
      console.error('create-payment mock error:', result.error);
      process.exitCode = 2;
      return;
    }

    console.log('create-payment mock response:', JSON.stringify(result.data, null, 2));

    if (result.data.status === 'approved') {
      console.log('Payment approved — frontend would redirect to: /?payment=success');
    } else if (result.data.status === 'pending') {
      console.log('Payment pending — frontend shows pending flow');
    } else {
      console.log('Payment status:', result.data.status);
    }

  } catch (err) {
    console.error('Unexpected mock error:', err);
    process.exitCode = 1;
  }
})();
