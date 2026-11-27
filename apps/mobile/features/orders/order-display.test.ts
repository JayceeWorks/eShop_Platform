import { buildTimeline, formatDate, formatDateTime, statusTone } from './order-display';

const at = (minute: number) => new Date(2026, 10, 27, 14, minute).toISOString();

describe('buildTimeline', () => {
  it('marks reached steps done and the current one in progress', () => {
    const steps = buildTimeline('PACKED', [
      { status: 'PLACED', note: null, at: at(0) },
      { status: 'CONFIRMED', note: null, at: at(5) },
      { status: 'PACKED', note: null, at: at(9) },
    ]);
    expect(steps.map((step) => step.state)).toEqual([
      'done',
      'done',
      'current',
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
    expect(steps[2]?.at).toBe(at(9));
    expect(steps[3]?.at).toBeNull();
  });

  it('shows a delivered order as fully done', () => {
    const steps = buildTimeline('DELIVERED', []);
    expect(steps.every((step) => step.state === 'done')).toBe(true);
  });

  it('ends a cancelled order at Cancelled', () => {
    const steps = buildTimeline('CANCELLED', [
      { status: 'PLACED', note: null, at: at(0) },
      { status: 'CANCELLED', note: 'Changed my mind', at: at(3) },
    ]);
    expect(steps.map((step) => `${step.status}:${step.state}`)).toEqual([
      'PLACED:done',
      'CANCELLED:current',
    ]);
  });
});

describe('date formatting', () => {
  it('formats dates and times for India', () => {
    expect(formatDate(at(5))).toBe('27 Nov 2026');
    expect(formatDateTime(at(5))).toBe('27 Nov, 2:05 pm');
    expect(formatDateTime(new Date(2026, 0, 3, 0, 7).toISOString())).toBe('3 Jan, 12:07 am');
  });
});

describe('statusTone', () => {
  it('groups statuses by colour', () => {
    expect(statusTone('SHIPPED')).toBe('progress');
    expect(statusTone('DELIVERED')).toBe('done');
    expect(statusTone('CANCELLED')).toBe('cancelled');
  });
});
