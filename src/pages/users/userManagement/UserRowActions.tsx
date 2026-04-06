import React from 'react';
import { Edit2, Trash2, UserPlus, UserX } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import type { User } from '../../../services/userService';
import { rowActionVariants } from './userRowStyles';

export type UserRowActionKey =
  | 'edit'
  | 'suspend'
  | 'activate'
  | 'remove'
  | 'add'
  | 'removeGroup';

export interface UserRowActionsProps {
  user: User;
  canManageCompany: boolean;
  onEdit: (u: User) => void;
  onSuspend: (u: User) => void;
  onActivate: (u: User) => void;
  onRemove: (u: User) => void;
  onAddToGroup: (u: User) => void;
  onRemoveFromGroup: (u: User) => void;
}

type ActionItem = {
  key: UserRowActionKey;
  icon: React.ElementType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  className: string;
  onClick: () => void;
};

export const UserRowActions: React.FC<UserRowActionsProps> = ({
  user,
  canManageCompany,
  onEdit,
  onSuspend,
  onActivate,
  onRemove,
  onAddToGroup,
  onRemoveFromGroup,
}) => {
  const selfEmail = useAuthStore((s) => s.user?.email?.toLowerCase().trim() ?? '');
  const activeGroupId = useAuthStore((s) => s.context?.activeGroupId ?? '');
  const isSelf = Boolean(selfEmail && user.email.toLowerCase().trim() === selfEmail);
  const isInActiveGroup = React.useMemo(() => {
    const gid = String(activeGroupId || '').trim();
    if (!gid) return false;
    if (Array.isArray(user.workspaces) && user.workspaces.some((w) => String(w.groupId || '') === gid)) {
      return true;
    }
    return String(user.groupID || '') === gid;
  }, [activeGroupId, user.groupID, user.workspaces]);

  const companyActions: ActionItem[] = React.useMemo(() => {
    const suspendOrActivate: ActionItem =
      user.status === 'Inactive'
        ? {
            key: 'activate',
            icon: UserX,
            title: 'Activate user',
            className: rowActionVariants.neutral,
            onClick: () => onActivate(user),
          }
        : {
            key: 'suspend',
            icon: UserX,
            title: 'Suspend user',
            className: rowActionVariants.dangerSoft,
            onClick: () => onSuspend(user),
          };
    return [
      {
        key: 'edit',
        icon: Edit2,
        title: 'Edit profile',
        className: rowActionVariants.neutral,
        onClick: () => onEdit(user),
      },
      suspendOrActivate,
      {
        key: 'remove',
        icon: Trash2,
        title: 'Remove user',
        className: rowActionVariants.dangerStrong,
        onClick: () => onRemove(user),
      },
    ];
  }, [user, onEdit, onSuspend, onActivate, onRemove]);

  const groupActions: ActionItem[] = React.useMemo(() => {
    if (isInActiveGroup) {
      return [
        {
          key: 'removeGroup',
          icon: UserX,
          title: 'Remove from group',
          className: rowActionVariants.dangerSoft,
          onClick: () => onRemoveFromGroup(user),
        },
      ];
    }
    return [
      {
        key: 'add',
        icon: UserPlus,
        title: 'Add to group',
        className: rowActionVariants.neutral,
        onClick: () => onAddToGroup(user),
      },
    ];
  }, [isInActiveGroup, user, onAddToGroup, onRemoveFromGroup]);

  const actions = React.useMemo(() => {
    if (canManageCompany) {
      if (isSelf) return companyActions.filter((a) => a.key === 'edit');
      return companyActions;
    }
    if (isSelf) return [];
    return groupActions;
  }, [canManageCompany, isSelf, companyActions, groupActions]);

  if (actions.length === 0) {
    return (
      <span className="text-[10px] font-medium text-muted-foreground/35" title="No actions for your account on this row">
        —
      </span>
    );
  }

  return (
    <div className="flex min-w-max items-center justify-end gap-1 whitespace-nowrap sm:gap-1.5">
      {actions.map(({ key, icon: Icon, title, className, onClick }) => (
        <button
          key={key}
          type="button"
          aria-label={title}
          title={title}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={className}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </button>
      ))}
    </div>
  );
};
