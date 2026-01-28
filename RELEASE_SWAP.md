# Shopify: DEV + PROD themes (no “Publish swap”)

## Goal
- DEV theme = preview & testing
- PROD theme (live) = updated only when you intentionally deploy
- No swapping themes (DEV never becomes PROD)

---

## One-time setup

### 1) Install Shopify CLI (Windows / PowerShell)
```powershell
npm i -g @shopify/cli
```

### 2) Log in
Newer Shopify CLI uses `auth login`:
```powershell
shopify auth login
```

### 3) Pick your store + theme IDs
List themes and copy the IDs:
```powershell
shopify theme list --store YOURSTORE.myshopify.com
```

You need:
- `PROD_THEME_ID` = published/live theme ID
- `DEV_THEME_ID` = dev/unpublished theme ID

---

## Local workflow (safe)

### 4) Pull the DEV theme locally (first time only)
From an empty project folder:
```powershell
shopify theme pull --store YOURSTORE.myshopify.com --theme DEV_THEME_ID
```

Now your local folder = your theme codebase.

### 5) Develop against DEV
Start a dev preview session:
```powershell
shopify theme dev --store YOURSTORE.myshopify.com --theme DEV_THEME_ID
```

Normal loop:
- Edit code locally
- Test using the preview URL the CLI prints (mobile + key PDPs)
- Commit/push to Git whenever you want (Git is your source of truth)

---

## Deploy to PROD (live) without swapping

### 6) Avoid overwriting PROD Customizer settings (important)
Risky file:
- `config/settings_data.json` (Customizer layout/settings)

Best practice: don’t push this to PROD unless you intend to replace PROD’s layout.

Deploy while ignoring Customizer settings:
```powershell
shopify theme push --store YOURSTORE.myshopify.com --theme PROD_THEME_ID --ignore config/settings_data.json
```

Tip: add more `--ignore` patterns if needed.

### 7) Deploy
When DEV is good and tested:
1. In Shopify Admin, duplicate PROD for rollback (name it `PROD backup YYYY-MM-DD`)
2. Deploy from your local folder to the PROD theme ID:

```powershell
shopify theme push --store YOURSTORE.myshopify.com --theme PROD_THEME_ID --ignore config/settings_data.json
```

This updates PROD’s code directly. No DEV → PROD swap.

---

## Post-deploy checklist (2 minutes)
Open your storefront in incognito and check:
- Homepage
- 1–2 critical product pages (e.g., Radiance Face)
- Cart
- Checkout entry

If broken:
- Switch published theme to your PROD backup (instant rollback), or push a fix.

---

## Command cheat sheet
```powershell
# List themes (get IDs)
shopify theme list --store YOURSTORE.myshopify.com

# Pull DEV theme
shopify theme pull --store YOURSTORE.myshopify.com --theme DEV_THEME_ID

# Preview/dev against DEV theme
shopify theme dev --store YOURSTORE.myshopify.com --theme DEV_THEME_ID

# Deploy to PROD (safe: ignore Customizer settings)
shopify theme push --store YOURSTORE.myshopify.com --theme PROD_THEME_ID --ignore config/settings_data.json
```

---

## Troubleshooting

### Node version too old for Shopify CLI
If Shopify CLI warns that Node must be `>= 20.10.0`, upgrade Node (one option is `winget`):
```powershell
winget upgrade --id OpenJS.NodeJS.20 --source winget --accept-package-agreements --accept-source-agreements
node -v
```

### Store connection errors (GraphQL 404)
If `shopify theme list --store ...` returns a 404, double-check you’re using the correct `*.myshopify.com` domain for the store you have access to.
# Shopify Option B: DEV + PROD themes (no “Publish swap”), deploy with Shopify CLI

## Goal
- **DEV theme** = preview & testing  
- **PROD theme (live)** = updated only when you intentionally deploy  
- **No swapping themes** (DEV never becomes PROD)

---

## 1) One-time setup

### Install Shopify CLI + Theme tools (Windows / PowerShell)
```powershell
npm i -g @shopify/cli @shopify/theme

shopify login --store YOURSTORE.myshopify.com

shopify theme list --store YOURSTORE.myshopify.com

Copy the IDs for

PROD_THEME_ID = published/live theme ID

DEV_THEME_ID = dev/unpublished theme ID


3) Pull the DEV theme locally (first time only)

From an empty project folder:

shopify theme pull --store YOURSTORE.myshopify.com --theme DEV_THEME_ID


Now your local folder = your theme codebase.

4) Develop safely against DEV

Start a dev preview session:

shopify theme dev --store YOURSTORE.myshopify.com --theme DEV_THEME_ID


Do your normal loop:

Edit code locally

Test using the preview URL the CLI prints (mobile + key PDPs)

Commit/push to Git whenever you want (Git is your source of truth)

5) Prevent overwriting PROD Customizer settings (important)
Risky file

config/settings_data.json (Customizer layout/settings)

Best practice: don’t push this to PROD unless you intend to replace PROD’s layout.

Deploy while ignoring Customizer settings
shopify theme push --store YOURSTORE.myshopify.com --theme PROD_THEME_ID --ignore config/settings_data.json


Tip: You can add more --ignore patterns if needed.

6) Deploy to PROD (live) without swapping themes

When DEV is good and tested:

In Shopify Admin, duplicate PROD for rollback:

Name it: PROD backup YYYY-MM-DD

Deploy from your local folder to the PROD theme ID:

shopify theme push --store YOURSTORE.myshopify.com --theme PROD_THEME_ID --ignore config/settings_data.json


This updates PROD’s code directly. No DEV → PROD swap.

7) Post-deploy checklist (2 minutes)

Open your storefront in incognito and check:

Homepage

1–2 critical product pages (e.g., Radiance Face)

Cart

Checkout entry

If broken:

Switch published theme to your PROD backup (instant rollback), or push a fix.

Command cheat sheet
# List themes (get IDs)
shopify theme list --store YOURSTORE.myshopify.com

# Pull DEV theme
shopify theme pull --store YOURSTORE.myshopify.com --theme DEV_THEME_ID

# Preview/dev against DEV theme
shopify theme dev --store YOURSTORE.myshopify.com --theme DEV_THEME_ID

# Deploy to PROD (safe: ignore Customizer settings)
shopify theme push --store YOURSTORE.myshopify.com --theme PROD_THEME_ID --ignore config/settings_da