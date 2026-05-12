import React from 'react'
import { motion } from 'framer-motion'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen pt-16 pb-28">
      <main id="main-content" className="px-5 py-4">
        <div className="app-container max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="font-display text-h2 text-white">Privacy Policy</h1>
            <p className="text-caption text-text-muted mt-1">Last updated: May 12, 2026</p>
          </motion.div>

          <div className="space-y-6 text-body text-text-secondary">
            <section>
              <h2 className="font-display text-h4 text-white mb-2">1. Overview</h2>
              <p>
                GachaFi is a decentralized application (dApp) built on the Radix network.
                This Privacy Policy explains what data we collect, how we use it, and your rights.
              </p>
            </section>

            <section>
              <h2 className="font-display text-h4 text-white mb-2">2. Data We Collect</h2>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong>Wallet address:</strong> Your Radix wallet address is used to interact with the blockchain.</li>
                <li><strong>Transaction data:</strong> All transactions are recorded on the Radix blockchain and are publicly visible.</li>
                <li><strong>Local cache:</strong> Capsule and inventory data is stored locally in your browser (IndexedDB).</li>
                <li><strong>Analytics:</strong> Optional PostHog analytics for app improvement (can be disabled).</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-h4 text-white mb-2">3. Blockchain Immutability</h2>
              <p>
                Data written to the Radix blockchain is immutable and cannot be deleted.
                This includes transaction records and smart contract interactions.
              </p>
            </section>

            <section>
              <h2 className="font-display text-h4 text-white mb-2">4. Your Rights (GDPR / CCPA)</h2>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong>Right to access:</strong> All your data is visible on-chain or in your browser.</li>
                <li><strong>Right to erasure:</strong> Local data can be cleared by clearing your browser storage. On-chain data cannot be erased due to blockchain immutability.</li>
                <li><strong>Right to opt out:</strong> You can disable analytics by blocking PostHog in your browser.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-h4 text-white mb-2">5. Contact</h2>
              <p>
                For privacy-related inquiries, contact us through our community channels.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
