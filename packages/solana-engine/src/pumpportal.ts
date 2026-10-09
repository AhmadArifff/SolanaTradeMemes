import { Result, TradeLocalRequestSchema, type TradeLocalRequestInput } from '@repo/types';

const DEFAULT_PUMPPORTAL_URL = 'https://pumpportal.fun/api/trade-local';

/**
 * Meminta transaksi unsigned serialized dari API PumpPortal trade-local.
 * Seluruh proses dilakukan langsung di peramban pengguna tanpa mengirimkan kunci privat.
 */
export async function fetchTradeLocalTransaction(
  request: TradeLocalRequestInput,
  endpointUrl: string = DEFAULT_PUMPPORTAL_URL
): Promise<Result<Uint8Array>> {
  // 1. Validasi parameter permintaan dengan skema Zod
  const validation = TradeLocalRequestSchema.safeParse(request);
  if (!validation.success) {
    const errorMsg = validation.error.errors[0]?.message ?? 'Parameter transaksi perdagangan tidak valid';
    return Result.fail(errorMsg);
  }

  const validParams = validation.data;

  try {
    // 2. Kirim permintaan POST ke PumpPortal trade-local
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publicKey: validParams.publicKey,
        action: validParams.action,
        mint: validParams.mint,
        amount: validParams.amount,
        denominatedInSol: validParams.denominatedInSol ? 'true' : 'false',
        slippage: validParams.slippage,
        priorityFee: validParams.priorityFee,
        pool: validParams.pool || 'pump',
      }),
    });

    // 3. Tangani respons error HTTP
    if (!response.ok) {
      const errorText = await response.text();
      return Result.fail(
        `PumpPortal HTTP ${response.status}: ${errorText || 'Gagal merakit instruksi perdagangan'}`
      );
    }

    // 4. Konversi payload biner menjadi Uint8Array untuk deserialisasi VersionedTransaction
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return Result.fail('PumpPortal mengembalikan data transaksi kosong.');
    }

    return Result.ok(new Uint8Array(arrayBuffer));
  } catch (error) {
    return Result.fail(
      error instanceof Error
        ? `Jaringan PumpPortal error: ${error.message}`
        : 'Gagal terhubung ke endpoint PumpPortal API'
    );
  }
}
