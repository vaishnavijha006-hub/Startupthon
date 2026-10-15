/** Parse RFC 4180-style CSV records, including quoted commas and newlines. */
export function parseCsv(csv) {
  const input = csv.startsWith('\uFEFF') ? csv.slice(1) : csv;
  const records = [];
  let row = [];
  let field = '';
  let quoted = false;
  let afterQuote = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
        afterQuote = true;
      } else {
        field += char;
      }
      continue;
    }

    if (afterQuote) {
      if (char === ',') {
        row.push(field);
        field = '';
        afterQuote = false;
      } else if (char === '\r' || char === '\n') {
        row.push(field);
        records.push(row);
        row = [];
        field = '';
        afterQuote = false;
        if (char === '\r' && input[i + 1] === '\n') i++;
      } else {
        throw new Error(`Unexpected character after closing quote: ${char}`);
      }
      continue;
    }

    if (char === '"') {
      if (field.length !== 0) throw new Error('Quote found inside an unquoted CSV field');
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\r' || char === '\n') {
      row.push(field);
      records.push(row);
      row = [];
      field = '';
      if (char === '\r' && input[i + 1] === '\n') i++;
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error('Unclosed quoted CSV field');
  if (afterQuote || field.length > 0 || row.length > 0) {
    row.push(field);
    records.push(row);
  }
  return records;
}
