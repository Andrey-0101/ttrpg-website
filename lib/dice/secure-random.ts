export type Uint32RandomSource = (target: Uint32Array) => void;

const UINT32_RANGE_SIZE = 0x1_0000_0000;

export const cryptoUint32RandomSource: Uint32RandomSource = (target) => {
  globalThis.crypto.getRandomValues(target);
};

export function generateUnbiasedInteger(
  minimumInclusive: number,
  maximumExclusive: number,
  randomSource: Uint32RandomSource = cryptoUint32RandomSource,
): number {
  if (
    !Number.isSafeInteger(minimumInclusive) ||
    !Number.isSafeInteger(maximumExclusive) ||
    minimumInclusive >= maximumExclusive
  ) {
    throw new RangeError(
      "Random integer bounds must be safe integers in ascending order.",
    );
  }

  const rangeSize = maximumExclusive - minimumInclusive;

  if (rangeSize > UINT32_RANGE_SIZE) {
    throw new RangeError(
      "Random integer range must not exceed the Uint32 sample space.",
    );
  }

  const acceptanceLimit =
    UINT32_RANGE_SIZE - (UINT32_RANGE_SIZE % rangeSize);
  const sample = new Uint32Array(1);

  while (true) {
    randomSource(sample);

    if (sample[0] < acceptanceLimit) {
      return minimumInclusive + (sample[0] % rangeSize);
    }
  }
}
