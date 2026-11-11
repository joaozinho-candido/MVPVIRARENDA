export function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

export function luhnValid(cardNumber: string): boolean {
  const n = onlyDigits(cardNumber);
  if (n.length < 13 || n.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

export function expiryValid(mmYY: string, now = new Date()): boolean {
  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(mmYY.trim());
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const end = new Date(year, month, 1); // primeiro dia do mês seguinte
  return end > now;
}

export function cpfValid(cpf: string): boolean {
  const n = onlyDigits(cpf);
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(n[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(n[9]) && calc(10) === Number(n[10]);
}
