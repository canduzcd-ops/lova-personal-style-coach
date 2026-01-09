export function normalizeTagList(list: any): string[] {
  if (list == null) return [];
  const array = Array.isArray(list) ? list : typeof list === 'string' ? [list] : [];
  if (!array.length) return [];

  const synonymMap: Record<string, string> = {
    siyah: 'black',
    black: 'black',
    beyaz: 'white',
    white: 'white',
    gri: 'gray',
    gray: 'gray',
    grey: 'gray',
    "kırmızı": 'red',
    red: 'red',
    mavi: 'blue',
    blue: 'blue',
    bej: 'beige',
    beige: 'beige',
    minimal: 'minimal',
    minimalist: 'minimal',
    sport: 'sport',
    sports: 'sport',
    spor: 'sport',
    classic: 'classic',
    klasik: 'classic',
    street: 'street',
    streetwear: 'street',
  };

  const results: string[] = [];
  for (const raw of array) {
    let text = '';
    if (typeof raw === 'string') text = raw;
    else if (raw != null) text = String(raw);

    text = text
      .normalize('NFKC')
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .toLowerCase();

    if (!text) continue;

    const canonical = synonymMap[text] ?? text;
    if (!results.includes(canonical)) {
      results.push(canonical);
      if (results.length >= 20) break;
    }
  }

  return results;
}
