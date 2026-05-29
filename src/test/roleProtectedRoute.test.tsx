import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RoleProtectedRoute } from '../components/auth/RoleProtectedRoute';

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

function renderRoute(
  props: React.ComponentProps<typeof RoleProtectedRoute>,
  initialPath = '/protected',
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/protected" element={<RoleProtectedRoute {...props} />}>
          <Route index element={<div>Protected Content</div>} />
        </Route>
        <Route path="/forbidden" element={<div>Forbidden Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseRbac.mockReturnValue({ ...defaultRbac, hasCapability: vi.fn(() => false) });
});

describe('RoleProtectedRoute', () => {
  describe('no restrictions', () => {
    it('renders outlet when no restrictions are set', () => {
      renderRoute({});
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('requiredCapability', () => {
    it('renders outlet when user has the required capability', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasCapability: vi.fn((cap) => cap === 'users:read'),
      });
      renderRoute({ requiredCapability: 'users:read' });
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects to /forbidden when user lacks the required capability', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasCapability: vi.fn(() => false),
      });
      renderRoute({ requiredCapability: 'users:read' });
      expect(screen.getByText('Forbidden Page')).toBeInTheDocument();
    });

    it('redirects to a custom path when redirectTo prop is provided', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasCapability: vi.fn(() => false),
      });
      renderRoute({ requiredCapability: 'users:read', redirectTo: '/login' });
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('requiredAnyCapabilities', () => {
    it('renders outlet when user has at least one of the required capabilities', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasCapability: vi.fn((cap) => cap === 'reports:view'),
      });
      renderRoute({ requiredAnyCapabilities: ['users:read', 'reports:view'] });
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects when user has none of the required capabilities', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasCapability: vi.fn(() => false),
      });
      renderRoute({ requiredAnyCapabilities: ['users:read', 'reports:view'] });
      expect(screen.getByText('Forbidden Page')).toBeInTheDocument();
    });

    it('renders outlet when requiredAnyCapabilities is an empty array', () => {
      renderRoute({ requiredAnyCapabilities: [] });
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('requiredOrgRole', () => {
    it('renders outlet when orgRole matches', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        orgRole: 'COMPANY_ADMIN',
      });
      renderRoute({ requiredOrgRole: 'COMPANY_ADMIN' });
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects when orgRole does not match', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        orgRole: 'MEMBER',
      });
      renderRoute({ requiredOrgRole: 'COMPANY_ADMIN' });
      expect(screen.getByText('Forbidden Page')).toBeInTheDocument();
    });
  });

  describe('requiredGroupRole', () => {
    it('renders outlet when activeGroupRole matches', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        activeGroupRole: 'GROUP_ADMIN',
      });
      renderRoute({ requiredGroupRole: 'GROUP_ADMIN' });
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects when activeGroupRole does not match', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        activeGroupRole: 'SEARCH_USER',
      });
      renderRoute({ requiredGroupRole: 'GROUP_ADMIN' });
      expect(screen.getByText('Forbidden Page')).toBeInTheDocument();
    });
  });

  describe('requiredAnyGroupAdmin', () => {
    it('renders outlet when orgRole is COMPANY_ADMIN', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        orgRole: 'COMPANY_ADMIN',
        activeGroupRole: null,
      });
      renderRoute({ requiredAnyGroupAdmin: true });
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders outlet when activeGroupRole is GROUP_ADMIN', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        orgRole: 'MEMBER',
        activeGroupRole: 'GROUP_ADMIN',
      });
      renderRoute({ requiredAnyGroupAdmin: true });
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects when user is neither company admin nor group admin', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        orgRole: 'MEMBER',
        activeGroupRole: 'SEARCH_USER',
      });
      renderRoute({ requiredAnyGroupAdmin: true });
      expect(screen.getByText('Forbidden Page')).toBeInTheDocument();
    });
  });

  describe('requiredWorkspaceMember', () => {
    it('renders outlet when user is COMPANY_ADMIN', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        orgRole: 'COMPANY_ADMIN',
        groups: [],
      });
      renderRoute({ requiredWorkspaceMember: true });
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders outlet when user has at least one group membership', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        orgRole: 'MEMBER',
        groups: [{ groupId: 'g1', groupName: 'A', role: 'SEARCH_USER' }],
      });
      renderRoute({ requiredWorkspaceMember: true });
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects when non-admin user has no group memberships', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        orgRole: 'MEMBER',
        groups: [],
      });
      renderRoute({ requiredWorkspaceMember: true });
      expect(screen.getByText('Forbidden Page')).toBeInTheDocument();
    });
  });

  describe('combined restrictions', () => {
    it('redirects when capability check passes but orgRole check fails', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasCapability: vi.fn(() => true),
        orgRole: 'MEMBER',
      });
      renderRoute({ requiredCapability: 'users:read', requiredOrgRole: 'COMPANY_ADMIN' });
      expect(screen.getByText('Forbidden Page')).toBeInTheDocument();
    });

    it('renders outlet when all combined restrictions pass', () => {
      mockUseRbac.mockReturnValue({
        ...defaultRbac,
        hasCapability: vi.fn(() => true),
        orgRole: 'COMPANY_ADMIN',
        activeGroupRole: 'GROUP_ADMIN',
      });
      renderRoute({
        requiredCapability: 'users:read',
        requiredOrgRole: 'COMPANY_ADMIN',
        requiredGroupRole: 'GROUP_ADMIN',
      });
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
