import { markFilled } from './report';
/**
 * Safely create and dispatch an Event in the realm/window of the target element.
 * Works seamlessly across iframes, embedded widgets, and JSDOM test suites.
 */
function dispatchNativeEvent(element: Element, eventType: string): void {
  try {
    const doc = element.ownerDocument || document;
    const win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
    const EventCtor = win?.Event || (typeof Event !== 'undefined' ? Event : null);

    if (EventCtor) {
      element.dispatchEvent(new EventCtor(eventType, { bubbles: true, composed: true }));
    } else {
      const evt = doc.createEvent('Event');
      evt.initEvent(eventType, true, true);
      element.dispatchEvent(evt);
    }
  } catch {
    // Graceful fallback
    try {
      element.dispatchEvent(new Event(eventType, { bubbles: true }));
    } catch {
      // Ignored
    }
  }
}

/**
 * Helper to dispatch native value setting that React / Vue / Angular change trackers detect.
 */
export function setNativeValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string
): void {
  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  const valueSetter = descriptor?.set;

  if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }

  dispatchNativeEvent(element, 'input');
  dispatchNativeEvent(element, 'change');
  dispatchNativeEvent(element, 'blur');
  markFilled(element);
}

/**
 * Select an option in HTMLSelectElement by matching text or value
 */
export function setNativeSelect(
  select: HTMLSelectElement,
  matcher: (optionText: string, optionVal: string) => boolean
): boolean {
  for (let i = 0; i < select.options.length; i++) {
    const opt = select.options[i];
    if (matcher(opt.text.toLowerCase(), opt.value.toLowerCase())) {
      select.selectedIndex = i;
      const prototype = Object.getPrototypeOf(select);
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      descriptor?.set?.call(select, opt.value);

      dispatchNativeEvent(select, 'input');
      dispatchNativeEvent(select, 'change');
      markFilled(select);
      return true;
    }
  }
  return false;
}

/**
 * Find and check a radio button matching a pattern in its label or value
 */
export function checkMatchingRadio(
  container: Element | Document,
  pattern: RegExp,
  namePrefix?: string
): boolean {
  const radios = Array.from(
    container.querySelectorAll('input[type="radio"]')
  ) as HTMLInputElement[];

  for (const radio of radios) {
    if (namePrefix && !radio.name.toLowerCase().includes(namePrefix.toLowerCase())) {
      continue;
    }

    const doc = radio.ownerDocument || document;
    // Check label text
    const label =
      radio.closest('label') ||
      (radio.id ? doc.querySelector(`label[for="${radio.id}"]`) : null);
    const labelText = label?.textContent?.trim() || '';
    const valText = radio.value || '';

    if (pattern.test(labelText) || pattern.test(valText)) {
      radio.checked = true;
      markFilled(radio);
      dispatchNativeEvent(radio, 'click');
      dispatchNativeEvent(radio, 'change');
      return true;
    }
  }
  return false;
}
