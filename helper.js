export const validInputs = (...inputs) =>
  inputs.every(input => Number.isFinite(input));

export const allPositiveNum = (...inputs) => inputs.every(input => input > 0);

export let api_key = '28dd70395bba4363b5f52413230205';