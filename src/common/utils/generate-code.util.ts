export function generateCode(length: number = 6): string {
  let code: string = '';
  const charSet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    const char = Math.floor(Math.random() * charSet.length);
    code += charSet[char];
  }
  return code;
}

export function generateRandomNumber(length: number = 6): string {
  let code: string = '';
  const charSet = '0123456789';
  for (let i = 0; i < length; i++) {
    const char = Math.floor(Math.random() * charSet.length);
    code += charSet[char];
  }
  return code;
}
