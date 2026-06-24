import React from 'react';
import { cn } from '../../utils/cn';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatErrorBanner } from './components/ChatErrorBanner';
import { ChatComposer } from './components/ChatComposer';
import { ChatAlertModal } from './components/ChatAlertModal';
import { ChatToast } from './components/ChatToast';
import { ChatMessagePair } from './components/ChatMessagePair';
import { ChatThinkingIndicator } from './components/ChatThinkingIndicator';
import { useChatPage } from './hooks/useChatPage';

const ChatPage: React.FC = () => {
  const {
    t,
    user,
    context,
    sidebarHidden,
    toggleSidebar,
    chatScrollRef,
    toast,
    qaBlocked,
    capMessage,
    sourcePillClass,
    formatSessionMeta,
    handleSourceClick,
    chatHeaderSubtitle,
    resetChatSurface,
    sessions,
    composer,
  } = useChatPage();

  if (!user || !context) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        {t('signInRequired')}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-row overflow-hidden -mx-4 w-[calc(100%+2rem)] max-w-none bg-gradient-to-br from-background via-surface-highest/10 to-background text-foreground lg:-mx-5 lg:w-[calc(100%+2.5rem)]">
      <span className={cn('hidden', sourcePillClass)} aria-hidden />

      <ChatSidebar
        hidden={sidebarHidden}
        sessions={sessions.chatDataState}
        isSessionLoading={sessions.isSessionLoading}
        currentSession={sessions.currentSession}
        onNewChat={resetChatSurface}
        onSelectSession={(id) => void sessions.selectChatSession(id, composer.setErrorText)}
        onDeleteSession={(id) => void sessions.handleDeleteChatSession(id, composer.setErrorText)}
        formatSessionMeta={formatSessionMeta}
      />

      <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-background to-background">
        <ChatHeader
          sidebarHidden={sidebarHidden}
          subtitle={chatHeaderSubtitle}
          onToggleSidebar={toggleSidebar}
        />

        <ChatAlertModal
          state={sessions.alertModal}
          onClose={() => sessions.setAlertModal({ open: false, title: '', msg: '' })}
        />

        {sessions.isSessionLoading && sessions.chatDataState.length > 0 && (
          <div className="flex items-center justify-center gap-2 border-b border-border/40 bg-surface-highest/10 py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
            <span className="text-xs text-muted-foreground">Loading…</span>
          </div>
        )}

        <ChatErrorBanner message={composer.errorText} />

        <main
          ref={chatScrollRef}
          className="mx-auto flex min-h-0 w-full min-w-0 max-w-7xl flex-1 flex-col overflow-y-auto overscroll-contain scroll-pb-28 px-4 pb-6 sm:px-6 lg:px-8"
        >
          {sessions.conversationPairs.map((pair, idx) => {
            const isLastPair = idx === sessions.conversationPairs.length - 1;
            const isInteractiveClarification =
              isLastPair &&
              pair.ai.responseKind === 'clarification' &&
              (pair.ai.clarificationOptions?.length ?? 0) > 0;
            return (
              <ChatMessagePair
                key={idx}
                pair={pair}
                questionLabel={t('question')}
                answerLabel={t('answer')}
                clarificationLabel="Clarification needed"
                onSourceClick={handleSourceClick}
                clarificationOptionsInteractive={isInteractiveClarification}
                clarificationOptionsDisabled={composer.isResponseLoading || qaBlocked}
                onClarificationOptionSelect={(option) =>
                  void composer.submitClarificationOption(option)
                }
                onClarificationCustomInput={() => composer.focusComposer()}
              />
            );
          })}

          {composer.isResponseLoading && <ChatThinkingIndicator label={t('thinking')} />}
        </main>

        <ChatComposer
          value={composer.text}
          isResponseLoading={composer.isResponseLoading}
          submitDisabled={qaBlocked}
          submitDisabledReason={qaBlocked ? capMessage('questionsMonth') : undefined}
          inputRef={composer.inputRef}
          onChange={composer.setText}
          onSubmit={composer.submitHandler}
        />

        <ChatToast toast={toast} />
      </section>
    </div>
  );
};

export default ChatPage;
