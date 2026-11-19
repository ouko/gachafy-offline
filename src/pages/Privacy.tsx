import { useState } from 'react';
import { Download, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { oneSignalService } from '@/lib/oneSignal';
import { clearLocalData, exportLocalData, getConsent, setConsent } from '@/lib/privacy';

export default function Privacy() {
  const [errorReporting, setErrorReporting] = useState(getConsent('errorReporting'));
  const [notifications, setNotifications] = useState(getConsent('notifications'));
  const [message, setMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const sentryConfigured = Boolean(import.meta.env.VITE_SENTRY_DSN);

  const updateErrorReporting = (enabled: boolean) => {
    setConsent('errorReporting', enabled);
    setErrorReporting(enabled);
    window.location.reload();
  };

  const updateNotifications = async (enabled: boolean) => {
    setMessage(null);
    try {
      if (enabled) {
        const granted = await oneSignalService.requestPermission();
        if (!granted) {
          setMessage('Notification permission was not granted. You can enable it later in browser settings.');
          return;
        }
      } else {
        await oneSignalService.optOut();
      }
      setConsent('notifications', enabled);
      setNotifications(enabled);
    } catch {
      setMessage('Notification settings could not be changed. No consent preference was saved.');
    }
  };

  const exportData = async () => {
    const contents = await exportLocalData();
    const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `gachafi-data-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Your local GachaFi data was exported.');
  };

  const deleteData = async () => {
    if (!window.confirm('Delete GachaFi streaks, consent choices, and queued requests from this device? Blockchain records cannot be deleted.')) return;
    setIsDeleting(true);
    try {
      if (notifications) await oneSignalService.optOut();
      await clearLocalData();
      setNotifications(false);
      setErrorReporting(false);
      setMessage('Local GachaFi data was deleted. Public blockchain records remain unchanged.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 pb-24">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <Shield className="mb-3 h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold">Privacy &amp; Data Controls</h1>
          <p className="mt-2 text-muted-foreground">Effective November 20, 2026. Control optional services and data stored on this device.</p>
        </header>

        {message && <Card role="status" className="p-4 text-sm">{message}</Card>}

        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold">Optional services</h2>
          <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-medium">Error reporting</h3>
              <p className="text-sm text-muted-foreground">Sentry receives scrubbed warnings and errors only with your consent.</p>
            </div>
            <Button variant="outline" disabled={!sentryConfigured} onClick={() => updateErrorReporting(!errorReporting)}>
              {sentryConfigured ? (errorReporting ? 'Disable Error Reporting' : 'Enable Error Reporting') : 'Not Configured'}
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-medium">Push notifications</h3>
              <p className="text-sm text-muted-foreground">OneSignal receives a push subscription and device information only after opt-in.</p>
            </div>
            <Button variant="outline" disabled={!oneSignalService.isConfigured} onClick={() => void updateNotifications(!notifications)}>
              {oneSignalService.isConfigured ? (notifications ? 'Disable Notifications' : 'Enable Notifications') : 'Not Configured'}
            </Button>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold">Your local data</h2>
          <p className="text-sm text-muted-foreground">Export or delete this device&apos;s consent choices, daily streak dates, and offline mint queue. The export includes the wallet address stored in queued requests.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => void exportData()}><Download className="mr-2 h-4 w-4" />Export My Data</Button>
            <Button variant="destructive" disabled={isDeleting} onClick={() => void deleteData()}><Trash2 className="mr-2 h-4 w-4" />{isDeleting ? 'Deleting…' : 'Delete Local Data'}</Button>
          </div>
        </Card>

        <Card className="space-y-4 p-6 text-sm leading-6">
          <h2 className="text-xl font-semibold">Privacy notice</h2>
          <p><strong>What the app processes:</strong> connecting a wallet sends your public Radix account address to the configured Radix Gateway so the app can read XRD balances, NFT inventory, and transactions. Wallet addresses and blockchain transactions are public and immutable; GachaFi cannot edit or delete them.</p>
          <p><strong>Local storage:</strong> daily streak dates, consent choices, and optional offline mint requests stay in your browser until you delete them or clear site data. No GachaFi backend, account password, advertising profile, or analytics database is used.</p>
          <p><strong>Optional recipients:</strong> consent-enabled error reports go to Sentry; notification subscriptions go to OneSignal. Their retention and international-transfer terms apply. GachaFi does not use these integrations for advertising or sell personal information. Use the toggles above to withdraw consent.</p>
          <p><strong>Your rights:</strong> use Export My Data and Delete Local Data for device data. For provider-held data or other privacy requests, contact the project through a <a className="text-primary underline" href="https://github.com/ouko/gachafy-offline/issues" target="_blank" rel="noopener noreferrer">GitHub issue</a>. Do not post private keys or sensitive personal information in a public issue.</p>
          <p><strong>Service providers:</strong> see the <a className="text-primary underline" href="https://sentry.io/legal/dpa/" target="_blank" rel="noopener noreferrer">Sentry DPA</a> and <a className="text-primary underline" href="https://onesignal.com/legal" target="_blank" rel="noopener noreferrer">OneSignal legal terms</a>. Operators must complete their own legal review and processor agreements before launch.</p>
        </Card>
      </div>
    </main>
  );
}
