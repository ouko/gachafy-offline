import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { hasConsentChoice, setConsent } from '@/lib/privacy';
import { oneSignalService } from '@/lib/oneSignal';

export function ConsentBanner() {
  const [visible, setVisible] = useState(!hasConsentChoice());
  const [isSaving, setIsSaving] = useState(false);
  const sentryConfigured = Boolean(import.meta.env.VITE_SENTRY_DSN);

  if (!visible || (!sentryConfigured && !oneSignalService.isConfigured)) return null;

  const reject = () => {
    setConsent('errorReporting', false);
    setConsent('notifications', false);
    setVisible(false);
  };

  const accept = async () => {
    setIsSaving(true);
    setConsent('errorReporting', sentryConfigured);
    setConsent('notifications', false);
    if (oneSignalService.isConfigured) await oneSignalService.requestPermission();
    window.location.reload();
  };

  return (
    <aside className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-lg rounded-2xl border bg-card p-4 shadow-xl" aria-label="Privacy choices">
      <h2 className="font-semibold">Optional data sharing</h2>
      <p className="mt-1 text-sm text-muted-foreground">GachaFi does not use advertising cookies. Choose whether to enable error reporting and push notifications. Wallet and Gateway reads are required for core dApp functions.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" disabled={isSaving} onClick={() => void accept()}>{isSaving ? 'Saving…' : 'Allow Optional'}</Button>
        <Button size="sm" variant="outline" onClick={reject}>Reject Optional</Button>
        <Button size="sm" variant="ghost" asChild onClick={() => setVisible(false)}><Link to="/privacy">Choose Settings</Link></Button>
      </div>
    </aside>
  );
}
