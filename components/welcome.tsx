'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProgressSummary } from '@/components/progress-summary';
import { HomeworkBanner } from '@/components/homework-banner';
import { StreakCounter } from '@/components/streak-counter';
import { SessionSummaryCards } from '@/components/session-summary-cards';
import { MoodJournalWidget } from '@/components/mood-journal-widget';
import { EnvironmentCheck } from '@/components/environment-check';
import { EmergencyContacts } from '@/components/emergency-contacts';
import { ActivationGate } from '@/components/activation-gate';

interface WelcomeProps {
  disabled: boolean;
  startButtonText: string;
  onStartCall: () => void;
}

type Stage = 'home' | 'activation' | 'env-check';

export const Welcome = ({
  disabled,
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeProps) => {
  const [stage, setStage] = useState<Stage>('home');

  return (
    <div
      ref={ref}
      inert={disabled}
      className="fixed inset-0 z-10 overflow-y-auto"
      style={{
        background:
          'linear-gradient(180deg, #0B1A2B 0%, #0F2537 50%, #0B1A2B 100%)',
      }}
    >
      <div className="mx-auto max-w-2xl px-4 pb-12 pt-20">
        {stage === 'activation' ? (
          <ActivationGate
            onActivated={() => setStage('env-check')}
            onCancel={() => setStage('home')}
          />
        ) : stage === 'env-check' ? (
          /* Environment Check Wizard */
          <EnvironmentCheck
            onReady={() => {
              setStage('home');
              onStartCall();
            }}
            onSkip={() => {
              setStage('home');
              onStartCall();
            }}
          />
        ) : (
          /* Dashboard Home */
          <>
            {/* Greeting + Start Session */}
            <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white">
                  Welcome back
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Ready for your next session?
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStage('activation')}
                className="h-11 shrink-0 rounded-xl border-0 px-6 text-base font-medium text-white"
                style={{
                  background: 'linear-gradient(135deg, #1A8A8A, #47C4CF)',
                }}
              >
                {startButtonText}
              </Button>
            </div>

            {/* Streak */}
            <StreakCounter />

            {/* Mood Journal */}
            <MoodJournalWidget />

            {/* Homework Action Item */}
            <HomeworkBanner />

            {/* Progress Stats */}
            <ProgressSummary />

            {/* Recent Sessions */}
            <SessionSummaryCards />

            {/* Emergency Contacts */}
            <EmergencyContacts />
          </>
        )}
      </div>
    </div>
  );
};
