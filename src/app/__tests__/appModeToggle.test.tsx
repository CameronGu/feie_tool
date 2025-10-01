import { fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';

function readFilledRows() {
  const inputs = Array.from(document.querySelectorAll('input[type="date"]')) as HTMLInputElement[];
  const rows: Array<[string, string]> = [];
  for (let index = 0; index < inputs.length; index += 2) {
    const start = inputs[index];
    const end = inputs[index + 1];
    if (start && end && start.value && end.value) {
      rows.push([start.value, end.value]);
    }
  }
  return rows;
}

function selectRange(start: string, end: string) {
  const startButton = document.querySelector(`button[data-date="${start}"]`) as HTMLButtonElement | null;
  if (!startButton) {
    throw new Error(`start button for ${start} not found`);
  }
  fireEvent.click(startButton);

  const endButton = document.querySelector(`button[data-date="${end}"]`) as HTMLButtonElement | null;
  if (!endButton) {
    throw new Error(`end button for ${end} not found`);
  }
  fireEvent.click(endButton);
}

describe('App mode toggling', () => {
  it('switches modes without prompting when no intervals exist', () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    const foreignRadio = screen.getByLabelText('Foreign travel periods') as HTMLInputElement;
    const usRadio = screen.getByLabelText('US travel periods') as HTMLInputElement;

    expect(foreignRadio.checked).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(usRadio);

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(usRadio.checked).toBe(true);

    fireEvent.click(foreignRadio);

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(foreignRadio.checked).toBe(true);
  });

  describe('quick add in US mode', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('allows keeping literal intervals when the user switches modes', async () => {
      render(
        <StrictMode>
          <App />
        </StrictMode>
      );

      const usRadio = screen.getByLabelText('US travel periods');
      fireEvent.click(usRadio);

      selectRange('2023-05-01', '2023-05-10');
      selectRange('2023-06-01', '2023-06-15');
      selectRange('2023-07-04', '2023-07-20');

      const beforeToggle = readFilledRows();
      expect(beforeToggle).toEqual([
        ['2023-05-01', '2023-05-10'],
        ['2023-06-01', '2023-06-15'],
        ['2023-07-04', '2023-07-20']
      ]);

      const foreignRadio = screen.getByLabelText('Foreign travel periods');
      fireEvent.click(foreignRadio);

      const literalButton = screen.getByRole('button', { name: /keep same date ranges/i });
      fireEvent.click(literalButton);

      await vi.runAllTimersAsync();

      expect(readFilledRows()).toEqual(beforeToggle);
    });
  });
});
