/** Finds the human-readable question attached to a form control. */
export function detectQuestionText(control: HTMLTextAreaElement | HTMLInputElement): string {
  const doc = control.ownerDocument;
  if (control.id) {
    const label = doc.querySelector(`label[for="${control.id.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim().replace(/\s+/g, ' ');
  }
  const parentLabel = control.closest('label');
  if (parentLabel?.textContent?.trim()) return parentLabel.textContent.trim().replace(/\s+/g, ' ');

  const labelledBy = control.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = labelledBy.split(/\s+/).map((id) => doc.getElementById(id)?.textContent?.trim() || '').join(' ').trim();
    if (text) return text.replace(/\s+/g, ' ');
  }

  const container = control.closest('div, section, fieldset, tr, td, li');
  if (container) {
    for (const h of Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6, legend, label, p, strong, span'))) {
      const text = h.textContent?.trim() || '';
      if (text.length > 5 && text.length < 240 && !/characters remaining|optional$/i.test(text)) return text.replace(/\s+/g, ' ');
    }
  }
  const aria = control.getAttribute('aria-label');
  if (aria && aria.length > 5) return aria.trim();
  if ('placeholder' in control && control.placeholder && control.placeholder.length > 5) return control.placeholder.trim();
  return '';
}
