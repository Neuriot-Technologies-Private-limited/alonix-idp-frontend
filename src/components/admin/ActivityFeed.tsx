import React from 'react';
import { useAuditLogs, type AuditLog } from '../../services/adminService';
import { Skeleton } from '../ui/Skeleton';
import {
  UserPlus,
  CheckCircle,
  FolderPlus,
  AlertTriangle,
  History
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const ActivityFeed: React.FC<{
  role?: string;
  limit?: number;
  /** When set (e.g. from dashboard bootstrap), skips a second audit fetch */
  logs?: AuditLog[];
}> = ({ role, limit, logs: logsProp }) => {
  const useFetch = logsProp === undefined;
  const { data: fetchedResult, isLoading } = useAuditLogs({}, { enabled: useFetch });
  const fetched = fetchedResult?.logs;
  const logs = logsProp !== undefined ? logsProp : fetched;

  // Basic filtering for demonstration
  const filteredLogs = logs?.filter(log => {
     if (role === 'GROUP_ADMIN') return log.type !== 'warning'; // Example filter
     return true;
  });

  const displayLogs = limit ? filteredLogs?.slice(0, limit) : filteredLogs;

  const getIcon = (type: string) => {
    switch (type) {
      case 'invite': return <UserPlus className="w-3 h-3" />;
      case 'ingestion': return <CheckCircle className="w-3 h-3" />;
      case 'creation': return <FolderPlus className="w-3 h-3" />;
      case 'warning': return <AlertTriangle className="w-3 h-3" />;
      default: return <History className="w-3 h-3" />;
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'ingestion':
        return 'text-success bg-success/10 border-success/20';
      case 'warning':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'creation': return 'text-primary bg-primary/10 border-primary/20';
      default:
        return 'text-muted-foreground bg-surface-low border-border/10';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical Line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/30 via-border/30 to-transparent dark:via-border/10" />

      <div className="space-y-6">
        {displayLogs?.map((log) => (
          <div key={log.id} className="relative flex gap-5 group">
            {/* Timeline Indicator */}
            <div className={cn(
              "relative z-10 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all group-hover:scale-110 shadow-lg",
              getStatusColor(log.type)
            )}>
              {getIcon(log.type)}
            </div>

            {/* Log Card */}
            <div className="flex-1 min-w-0">
               <div className="bg-surface-lowest hover:bg-surface-low p-4 rounded-2xl border border-border/15 shadow-sm transition-all hover:-translate-y-0.5 dark:bg-surface-highest/10 dark:hover:bg-surface-highest/20 dark:border-border/10">
                  <p className="text-[13px] leading-relaxed text-muted-foreground dark:text-foreground/80">
                    <span className="font-bold text-foreground">{log.user}</span>{' '}
                    <span className="text-muted-foreground">{
                      // Format the action text (e.g. CHAT_QUESTION_ASKED -> asked a question in)
                      (() => {
                        const actionMap: Record<string, string> = {
                          'CHAT_QUESTION_ASKED': 'asked a question in',
                          'GROUP_MEMBER_ROLE_UPDATED': 'updated the role of',
                          'GROUP_MEMBER_UPSERT': 'added or updated a member in',
                          'ORG_USER_UPDATED': 'updated profile of',
                          'CONNECTOR_CREATED': 'created connector',
                          'CONNECTOR_DELETED': 'deleted connector',
                          'BILLING_PLAN_UPGRADED': 'upgraded plan to',
                          'BILLING_PLAN_DOWNGRADED': 'downgraded plan to',
                          'BILLING_PLAN_CHANGED': 'changed plan to',
                          'BILLING_SUBSCRIPTION_CANCELED': 'canceled subscription',
                          'BILLING_PAYMENT_PAST_DUE': 'marked subscription past due',
                          'BILLING_CHECKOUT_STARTED': 'started checkout for',
                        };
                        return actionMap[log.action] || log.action.toLowerCase().replace(/_/g, ' ');
                      })()
                    }</span>{' '}
                    <span className="font-semibold text-foreground">{
                      // Format the target text (e.g. CHAT_SESSION:uuid -> chat session (uuid))
                      (() => {
                        if (!log.target) return '';
                        
                        // Use metadata for cleaner labels
                        if (log.metadata) {
                          const meta = log.metadata;
                          const query = typeof meta.query === 'string' ? meta.query : '';
                          if (log.action === 'CHAT_QUESTION_ASKED' && query) {
                            const title = query.length > 40 ? `${query.slice(0, 40)}...` : query;
                            return `chat session "${title}"`;
                          }
                          if (log.action === 'GROUP_CREATED' && typeof meta.groupName === 'string') {
                            return meta.groupName;
                          }
                          if (log.action.includes('MEMBER') && typeof meta.userEmail === 'string') {
                            return meta.userEmail;
                          }
                          if (
                            (log.action === 'ORG_USER_UPDATED' || log.action === 'ORG_USER_REMOVED') &&
                            typeof meta.email === 'string'
                          ) {
                            return meta.email;
                          }
                          if (
                            (log.action === 'CONNECTOR_CREATED' || log.action === 'CONNECTOR_DELETED') &&
                            typeof meta.connectorName === 'string'
                          ) {
                            const type =
                              typeof meta.connectorType === 'string' ? ` (${meta.connectorType})` : '';
                            return `${meta.connectorName}${type}`;
                          }
                          if (
                            log.action.startsWith('BILLING_') &&
                            typeof meta.newPlan === 'string'
                          ) {
                            return meta.newPlan;
                          }
                          if (
                            log.action === 'BILLING_CHECKOUT_STARTED' &&
                            typeof meta.planName === 'string'
                          ) {
                            return meta.planName;
                          }
                        }

                        if (log.target.includes(':')) {
                          const [type, id] = log.target.split(':');
                          const readableType = type.toLowerCase().replace(/_/g, ' ');
                          return `${readableType} (${id.slice(0, 8)}...)`;
                        }
                        return log.target;
                      })()
                    }</span>
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 dark:text-muted-foreground/40 font-display">
                      {log.timestamp}
                    </span>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
