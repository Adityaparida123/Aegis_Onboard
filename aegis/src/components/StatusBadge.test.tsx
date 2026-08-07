import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it.each(['Completed', 'Pending', 'Waiting Approval', 'In Progress', 'Failed', 'Cancelled'])(
    'renders the %s status',
    (status) => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(status)).toBeInTheDocument();
    }
  );

  it('falls back to a neutral style for unknown statuses', () => {
    render(<StatusBadge status="Mystery" />);
    expect(screen.getByText('Mystery').className).toContain('bg-slate-100');
  });
});
