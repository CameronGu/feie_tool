import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { IncomeIllustration } from '../components/IncomeIllustration';

afterEach(cleanup);
describe('income illustration controls', () => {
  it('synchronizes exact typed amounts, keyboard increments and the estimate without saving', () => {
    const before = { ...localStorage };
    render(<IncomeIllustration />);
    const input = screen.getByRole('spinbutton', { name: /Annual salary/ }) as HTMLInputElement;
    const slider = screen.getByRole('slider', { name: 'Adjust annual salary' }) as HTMLInputElement;
    expect(screen.getByText('Approximately $17,570')).toBeTruthy();
    expect(screen.getByText('~$17,500')).toBeTruthy();
    fireEvent.change(input, { target: { value: '180001' } });
    expect(slider.value).toBe('180001');
    expect(slider.getAttribute('aria-valuetext')).toBe('$180,001 annual salary');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(input.value).toBe('185001');
    fireEvent.change(slider, { target: { value: '249999' } });
    expect(input.value).toBe('250000');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(input.value).toBe('250000');
    expect(screen.getByText('Approximately $26,810')).toBeTruthy();
    expect({ ...localStorage }).toEqual(before);
  });
  it('keeps one estimate through disclosure changes and scales bars to the larger tax amount', () => {
    const { container } = render(<IncomeIllustration />);
    const toggle = screen.getByRole('button', { name: 'Adjust income and see the calculation' });
    const input = screen.getByRole('spinbutton', { name: /Annual salary/ });
    const bars = container.querySelectorAll<HTMLElement>('.tax-bar');
    expect(bars[0].style.width).toBe('100%');
    expect(bars[1].style.width).toBe('0%');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.change(input, { target: { value: '180000' } });
    expect(screen.getByText('Approximately $31,934')).toBeTruthy();
    expect(screen.getByText('Approximately $7,440')).toBeTruthy();
    expect(screen.getByText('~$24,500')).toBeTruthy();
    expect(bars[0].style.width).toBe('100%');
    expect(parseFloat(bars[1].style.width)).toBeCloseTo(100 * 7440 / 31934);
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect((input as HTMLInputElement).value).toBe('180000');
    expect(container.querySelectorAll('#example-salary')).toHaveLength(1);
  });
  it.each(['', '0', '30000.5', '250001'])('keeps the last valid estimate and explains invalid input %s', value => {
    render(<IncomeIllustration />);
    const input = screen.getByRole('spinbutton', { name: /Annual salary/ });
    fireEvent.change(input, { target: { value } });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText(/Estimates below use the last valid amount/)).toBeTruthy();
    expect(screen.getByText('Approximately $17,570')).toBeTruthy();
    fireEvent.change(input, { target: { value: '60000' } });
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(screen.getByText('Approximately $5,020')).toBeTruthy();
  });
});
