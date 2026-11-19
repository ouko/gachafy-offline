# dApp Metadata Configuration

Radix wallet validation requires metadata on the dApp definition account and a matching website manifest. Use the Stokenet or Mainnet developer console appropriate to the selected network.

## dApp definition metadata

Set:

| Field | Value |
|---|---|
| `account_type` | `dapp definition` |
| `name` | `GachaFi` |
| `description` | `Open fixed-price mystery boxes and collect badge NFTs on Radix.` |
| `icon_url` | `https://<your-production-origin>/icon-512.png` |
| `claimed_websites` | Your exact HTTPS origin, without a trailing slash |
| `claimed_entities` | Current package, component, and badge resource addresses |

Use only the current deployment's addresses. Do not use historical Lovable preview URLs. For local development, use the exact local origin required by the wallet/console and enable developer mode only for testing.

## Website manifest

The source fallback is `public/.well-known/radix.json`. During `npm run build`, the Vite `gachafi-radix-dapp-manifest` plugin writes `dist/.well-known/radix.json` from `VITE_RADIX_DAPP_DEFINITION`, keeping the manifest consistent with RDT configuration.

Verify after deployment:

```bash
curl --fail https://your-origin/.well-known/radix.json
```

The returned address must equal the build's dApp definition. Serve it as JSON over HTTPS without authentication.

## Verify the connection

1. Wait for the metadata transaction to commit.
2. Open the production origin in a fresh wallet session.
3. Connect and confirm the wallet shows GachaFi, the current origin, and expected accounts.
4. Confirm no validation warning remains. If it does, check exact origins, address typos, claimed entities, manifest availability, and Gateway propagation.

Metadata configuration is an operator action and is not claimed complete by the source repository.
