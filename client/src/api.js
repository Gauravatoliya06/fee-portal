const TOKEN_KEY = 'fp_token';
export const SCHOOL_NAME = import.meta.env.VITE_SCHOOL_NAME || 'Student Fee Portal';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event('fp:logout'));
    }
    throw new Error(data?.message || 'Something went wrong. Try again.');
  }
  return data;
}

// Opens the PDF receipt in a new tab (the request needs the auth header, so a plain link will not work).
export async function openReceipt(id) {
  const win = window.open('', '_blank');
  try {
    const res = await fetch(`/api/payments/${id}/receipt`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error('Could not load the receipt.');
    win.location.href = URL.createObjectURL(await res.blob());
  } catch (e) {
    win?.close();
    alert(e.message);
  }
}

// Change the currency here if needed.
const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
export const money = (n) => fmt.format(n || 0);
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
export const today = () => new Date().toISOString().slice(0, 10);
export const methodLabel = (m) => ({ cash: 'Cash', upi: 'UPI', cheque: 'Cheque', bank_transfer: 'Bank transfer', card: 'Card' }[m] || m);

export function downloadCSV(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
