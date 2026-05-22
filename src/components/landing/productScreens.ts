import {
  LayoutDashboard,
  MessageSquare,
  Users,
  FolderOpen,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import { brandConfig } from '../../brand/brandConfig';

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

const domain = brandConfig.websiteUrl.replace(/^https?:\/\/(www\.)?/, '');

export const PRODUCT_SCREENS: ProductScreen[] = [
  {
    id: 'dashboard',
    label: 'Operations dashboard',
    blurb: 'Metrics, group health, and live activity.',
    path: `app.${domain}/dashboard`,
    alt: `${brandConfig.name} operations dashboard`,
    src: brandConfig.dashboardShotUrl,
    icon: LayoutDashboard,
  },
  {
    id: 'documents',
    label: 'Documents vault',
    blurb: 'Ingest, pipeline stages, and review.',
    path: `app.${domain}/documents`,
    alt: `${brandConfig.name} documents page with pipeline lifecycle`,
    src: brandConfig.documentsShotUrl,
    icon: FolderOpen,
  },
  {
    id: 'groups',
    label: 'Groups & workspaces',
    blurb: 'Boundaries, health, and enter workspace.',
    path: `app.${domain}/groups`,
    alt: `${brandConfig.name} groups administration`,
    src: brandConfig.groupsShotUrl,
    icon: LayoutGrid,
  },
  {
    id: 'users',
    label: 'Users & roles',
    blurb: 'Invite, roles, and group assignments.',
    path: `app.${domain}/users`,
    alt: `${brandConfig.name} user management`,
    src: brandConfig.usersShotUrl,
    icon: Users,
  },
  {
    id: 'chat',
    label: 'Document Q&A',
    blurb: 'Cited answers from your corpus.',
    path: `app.${domain}/chat`,
    alt: `${brandConfig.name} AI chat with document citations`,
    src: brandConfig.chatShotUrl,
    icon: MessageSquare,
  },
];
