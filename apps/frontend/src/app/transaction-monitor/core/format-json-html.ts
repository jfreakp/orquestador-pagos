function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const JSON_TOKEN_PATTERN =
  /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

/**
 * Renders a value as pretty-printed, syntax-highlighted JSON HTML.
 * No external highlighter dependency: styling hooks are plain CSS classes
 * consumed by the host component's stylesheet.
 */
export function formatJsonHtml(value: unknown): string {
  if (value === undefined) {
    return '<span class="json-empty">(vacío)</span>';
  }

  const json = JSON.stringify(value, null, 2);
  const escaped = escapeHtml(json);

  return escaped.replace(JSON_TOKEN_PATTERN, (match) => {
    let cssClass = 'json-number';
    if (match.startsWith('"')) {
      cssClass = /:$/.test(match) ? 'json-key' : 'json-string';
    } else if (match === 'true' || match === 'false') {
      cssClass = 'json-boolean';
    } else if (match === 'null') {
      cssClass = 'json-null';
    }
    return `<span class="${cssClass}">${match}</span>`;
  });
}
