import {
  LayoutDashboard,
  MessageSquare,
  Users,
  FolderOpen,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import dashboardShot from '../../assets/landing/product-dashboard.png';
import chatShot from '../../assets/landing/product-chat.png';
import groupsShot from '../../assets/landing/product-groups.png';
import usersShot from '../../assets/landing/product-users.png';
import documentsShot from '../../assets/landing/product-documents.png';

/** Shared crop after trim — widescreen admin chrome (~1600×744) */
export const PRODUCT_SCREEN_ASPECT = 'aspect-[1600/744]';
export const PRODUCT_SCREEN_POSITION = 'object-top object-left';

export type ProductScreenId = 'dashboard' | 'chat' | 'groups' | 'users' | 'documents';

export type ProductScreen = {
  id: ProductScreenId;
  label: string;
  blurb: string;
  path: string;
  alt: string;
  src: string;
  icon: LucideIcon;
};

export const PRODUCT_SCREENS: ProductScreen[] = [
  {
    id: 'dashboard',
    label: 'Operations dashboard',
    blurb: 'Metrics, group health, and live activity.',
    path: 'app.alonix.ai/dashboard',
    alt: 'Alonix IDP operations dashboard',
    src: dashboardShot,
    icon: LayoutDashboard,
  },
  {
    id: 'documents',
    label: 'Documents vault',
    blurb: 'Ingest, pipeline stages, and review.',
    path: 'app.alonix.ai/documents',
    alt: 'Alonix IDP documents page with pipeline lifecycle',
    src: documentsShot,
    icon: FolderOpen,
  },
  {
    id: 'groups',
    label: 'Groups & workspaces',
    blurb: 'Boundaries, health, and enter workspace.',
    path: 'app.alonix.ai/groups',
    alt: 'Alonix IDP groups administration',
    src: groupsShot,
    icon: LayoutGrid,
  },
  {
    id: 'users',
    label: 'Users & roles',
    blurb: 'Invite, roles, and group assignments.',
    path: 'app.alonix.ai/users',
    alt: 'Alonix IDP user management',
    src: usersShot,
    icon: Users,
  },
  {
    id: 'chat',
    label: 'Document Q&A',
    blurb: 'Cited answers from your corpus.',
    path: 'app.alonix.ai/chat',
    alt: 'Alonix IDP AI chat with document citations',
    src: chatShot,
    icon: MessageSquare,
  },
];
