import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CapabilityGuard } from '../core/rbac/CapabilityGuard';

vi.mock('../hooks/useRbac');

import { useRbac } from '../hooks/useRbac';
import type { AuthContextPayload } from '../types/auth';

const mockUseRbac = vi.mocked(useRbac);

const defaultRbac: ReturnType<typeof useRbac> = {
  hasCapability: vi.fn(() => false),
  hasAnyCapability: vi.fn(() => false),
  hasAllCapabilities: vi.fn(() => false),
  orgRole: undefined,
  activeGroupRole: null,
  groups: [] as AuthContextPayload['groups'],
  accessibleGroupIds: [] as string[],
  adminGroupIds: [] as string[] | null,
  hasAnyGroupAdmin: false,
  isGroupAdminFor: vi.fn(() => false),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseRbac.mockReturnValue({ ...defaultRbac });
});

describe('CapabilityGuard', () => {
  describe('single capability (capability prop)', () => {
    it('renders children when user has the capability', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasCapability: vi.fn((cap) => cap === 'users:read'),
      });
      render(
        <CapabilityGuard capability="users:read">
          <span>Allowed</span>
        </CapabilityGuard>,
      );
      expect(screen.getByText('Allowed')).toBeInTheDocument();
    });

    it('renders nothing by default when user lacks the capability', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasCapability: vi.fn(() => false),
      });
      const { container } = render(
        <CapabilityGuard capability="users:read">
          <span>Allowed</span>
        </CapabilityGuard>,
      );
      expect(screen.queryByText('Allowed')).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });

    it('renders fallback when user lacks the capability and fallback is provided', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasCapability: vi.fn(() => false),
      });
      render(
        <CapabilityGuard capability="users:read" fallback={<span>No Access</span>}>
          <span>Allowed</span>
        </CapabilityGuard>,
      );
      expect(screen.getByText('No Access')).toBeInTheDocument();
      expect(screen.queryByText('Allowed')).not.toBeInTheDocument();
    });

    it('does not render fallback when user has the capability', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasCapability: vi.fn(() => true),
      });
      render(
        <CapabilityGuard capability="users:read" fallback={<span>No Access</span>}>
          <span>Allowed</span>
        </CapabilityGuard>,
      );
      expect(screen.getByText('Allowed')).toBeInTheDocument();
      expect(screen.queryByText('No Access')).not.toBeInTheDocument();
    });
  });

  describe('multiple capabilities — AND operator (default)', () => {
    it('renders children when user has all capabilities', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasAllCapabilities: vi.fn(() => true),
      });
      render(
        <CapabilityGuard capabilities={['users:read', 'users:write']}>
          <span>Allowed</span>
        </CapabilityGuard>,
      );
      expect(screen.getByText('Allowed')).toBeInTheDocument();
    });

    it('renders nothing when user lacks any capability (AND)', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasAllCapabilities: vi.fn(() => false),
      });
      render(
        <CapabilityGuard capabilities={['users:read', 'users:write']}>
          <span>Allowed</span>
        </CapabilityGuard>,
      );
      expect(screen.queryByText('Allowed')).not.toBeInTheDocument();
    });

    it('renders fallback when user lacks some capability (AND)', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasAllCapabilities: vi.fn(() => false),
      });
      render(
        <CapabilityGuard
          capabilities={['users:read', 'users:write']}
          operator="AND"
          fallback={<span>Insufficient Permissions</span>}
        >
          <span>Allowed</span>
        </CapabilityGuard>,
      );
      expect(screen.getByText('Insufficient Permissions')).toBeInTheDocument();
    });

    it('calls hasAllCapabilities with the provided array', () => {
      const hasAllCapabilities = vi.fn(() => true);
      mockUseRbac.mockReturnValue({ ...defaultRbac, hasAllCapabilities });
      render(
        <CapabilityGuard capabilities={['a', 'b', 'c']} operator="AND">
          <span>Content</span>
        </CapabilityGuard>,
      );
      expect(hasAllCapabilities).toHaveBeenCalledWith(['a', 'b', 'c']);
    });
  });

  describe('multiple capabilities — OR operator', () => {
    it('renders children when user has at least one capability', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasAnyCapability: vi.fn(() => true),
      });
      render(
        <CapabilityGuard capabilities={['users:read', 'reports:view']} operator="OR">
          <span>Allowed</span>
        </CapabilityGuard>,
      );
      expect(screen.getByText('Allowed')).toBeInTheDocument();
    });

    it('renders nothing when user has none of the capabilities (OR)', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasAnyCapability: vi.fn(() => false),
      });
      render(
        <CapabilityGuard capabilities={['users:read', 'reports:view']} operator="OR">
          <span>Allowed</span>
        </CapabilityGuard>,
      );
      expect(screen.queryByText('Allowed')).not.toBeInTheDocument();
    });

    it('renders fallback when user has none of the capabilities (OR)', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasAnyCapability: vi.fn(() => false),
      });
      render(
        <CapabilityGuard
          capabilities={['users:read', 'reports:view']}
          operator="OR"
          fallback={<span>Need One Permission</span>}
        >
          <span>Allowed</span>
        </CapabilityGuard>,
      );
      expect(screen.getByText('Need One Permission')).toBeInTheDocument();
    });

    it('calls hasAnyCapability with the provided array', () => {
      const hasAnyCapability = vi.fn(() => false);
      mockUseRbac.mockReturnValue({ ...defaultRbac, hasAnyCapability });
      render(
        <CapabilityGuard capabilities={['x', 'y']} operator="OR">
          <span>Content</span>
        </CapabilityGuard>,
      );
      expect(hasAnyCapability).toHaveBeenCalledWith(['x', 'y']);
    });
  });

  describe('no capability props provided', () => {
    it('does not render children when neither capability nor capabilities is given', () => {
      render(
        <CapabilityGuard>
          <span>Secret</span>
        </CapabilityGuard>,
      );
      expect(screen.queryByText('Secret')).not.toBeInTheDocument();
    });

    it('renders fallback when neither capability nor capabilities is given', () => {
      render(
        <CapabilityGuard fallback={<span>No Config</span>}>
          <span>Secret</span>
        </CapabilityGuard>,
      );
      expect(screen.getByText('No Config')).toBeInTheDocument();
    });
  });

  describe('children rendering', () => {
    it('renders complex children when authorized', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasCapability: vi.fn(() => true),
      });
      render(
        <CapabilityGuard capability="admin">
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </CapabilityGuard>,
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });
});
