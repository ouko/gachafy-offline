import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink, Wallet } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RadixWalletPromptProps {
  onDismiss?: () => void;
}

export const RadixWalletPrompt: React.FC<RadixWalletPromptProps> = ({ onDismiss }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Radix Wallet Required</h2>
        </div>

        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Wallet Detected</AlertTitle>
          <AlertDescription>
            To use GachaFi, you need the Radix Wallet browser extension installed.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h3 className="font-semibold">Quick Setup (2 minutes):</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Install Radix Wallet extension</li>
            <li>Create or import your wallet</li>
            <li>Switch to Stokenet (testnet)</li>
            <li>Get free test XRD from faucet</li>
            <li>Come back and connect!</li>
          </ol>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => window.open('https://wallet.radixdlt.com/', '_blank')}
            className="w-full"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Install Radix Wallet
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.open('https://stokenet-faucet.radixdlt.com/', '_blank')}
            className="w-full"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Get Test XRD (Faucet)
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open('/RADIX_SETUP.md', '_blank')}
            className="w-full"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View Full Setup Guide
          </Button>

          {onDismiss && (
            <Button
              variant="ghost"
              onClick={onDismiss}
              className="w-full"
            >
              I'll Set It Up Later
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Need help? See <a href="/RADIX_SETUP.md" target="_blank" className="text-primary underline">RADIX_SETUP.md</a> for detailed instructions.
        </p>
      </Card>
    </div>
  );
};
