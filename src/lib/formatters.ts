export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) {
    return digits.replace(/(\d{2})(\d{1,2})/, "$1/$2");
  }
  return digits.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
}

export function isValidDateBRL(value: string): boolean {
  if (!value || value.length !== 10) return false;
  const parts = value.split("/");
  if (parts.length !== 3) return false;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  if (month < 1 || month > 12) return false;

  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

export function cleanDigits(value: string): string {
  return value ? value.replace(/\D/g, "") : "";
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";
  const str = String(dateString).trim();
  // Se já estiver no formato dd/mm/aaaa
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return str;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return str;
  }
}

export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      // 24 horas sempre, sem depender do locale do navegador
      hourCycle: "h23",
    }).format(d);
  } catch {
    return String(dateString);
  }
}

export function calculateAge(birthDateString: string): number | null {
  if (!birthDateString) return null;
  try {
    let birth: Date;
    if (birthDateString.includes("/")) {
      const parts = birthDateString.split("/");
      if (parts.length === 3) {
        birth = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      } else {
        return null;
      }
    } else {
      birth = new Date(birthDateString);
    }
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 && age <= 130 ? age : null;
  } catch {
    return null;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}
