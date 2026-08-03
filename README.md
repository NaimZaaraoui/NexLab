# NexLab LIMS

NexLab CSSB is a production-oriented Laboratory Information Management System
for small and medium medical biology laboratories, especially CSSB/public-health
contexts. It covers the daily laboratory workflow: patient registration, test
ordering, result entry, validation, printing, quality control, stock monitoring,
audit trail, backup, and operational supervision.

![NexLab Dashboard](public/showcase.png)

## Why NexLab

NexLab was built from inside a real laboratory workflow. The goal is not only to
store results, but to make routine laboratory work faster, safer, and easier to
audit:

- fewer transcription errors
- faster keyboard-driven result entry
- clear validation flow
- professional printed reports
- local/offline deployment
- strong backup and recovery tools

## Main Features

### Analysis Workflow

- Patient registration and existing-patient search
- New analysis creation with test categories, bilan presets, and selected-test basket
- Batch analysis workflow
- Result entry grouped by category, with parent tests shown as section titles
- Keyboard navigation with Enter-to-next-field
- Technical and biological validation workflow
- Role-based access control: Admin, Technician, Biologist/Doctor, Receptionist
- Urgent analysis tracking and TAT monitoring
- Result notes, global notes, specimens, payment state, and report metadata

### Clinical Calculations

- Hematology indices: VGM/MCV, TCMH/MCH, CCMH/MCHC
- CBC discrimination and inflammation indices for printed reports
- eGFR calculation with adult and pediatric formula routing
- Calculated tests using configurable arithmetic formulas
- Abnormal result detection using sex-aware reference ranges
- Delta check with previous patient results during entry

### Reporting and Printing

- Professional A4 medical reports
- Multi-category and multi-page report layout
- Previous result column
- CBC indices page with interpretation
- Analyzer histogram page for compatible CBC imports
- PDF report generation and caching
- Internal print route protection with `INTERNAL_PRINT_TOKEN`
- Patient labels, analysis labels, envelopes, invoices, QC and temperature printouts
- Lab branding: logo, stamp, signature, report settings

### Quality Control

- QC materials and lots
- Target values, SD, acceptable ranges, and control modes
- QC result entry and Levey-Jennings style monitoring
- QC accumulation support
- QC readiness checks before technical validation
- QC print views and dashboard summaries

### Inventory

- Reagent and consumable catalog
- Lot tracking and expiry monitoring
- Receive, consume, waste, and adjust movements
- Reorder rules
- Inventory analytics
- Link tests to inventory consumption rules

### Patients and Documents

- Patient directory and patient detail pages
- Patient history
- Patient export and purge tools
- Document dashboard
- Printable patient card

### Operations and Security

- Dashboard KPIs and active work overview
- Audit logs, archive, and retention tools
- Audit immutability triggers
- Notifications
- Statistics dashboards and Excel exports
- CNAM-compatible export
- License system with read-only behavior when expired
- CSRF protection and rate limiting
- Database health checks and supervision

### Backup and Recovery

- Scheduled backups
- Manual database backups
- Recovery bundles containing database, uploads, and deployment files
- Optional AES-256-GCM backup encryption
- Database integrity checks
- Migration safety helpers and rollback tooling
- Optional external backup sync folder, for example Google Drive or Dropbox Desktop

## Quick Install: Offline Package

The recommended deployment for a lab workstation is the offline installer folder
`nexlab-install/`. It contains the Docker image archive, compose file, scripts,
and optional seed database.

### Requirements

- Docker Desktop on Windows/macOS, or Docker Engine on Linux
- 4 to 6 GB free disk space minimum
- Port 80 available on the server machine

### Windows

Open PowerShell inside `nexlab-install/`:

```powershell
.\install.ps1
```

### Linux / macOS

Open a terminal inside `nexlab-install/`:

```bash
bash install.sh
```

The installer will:

- load `nexlab-image.tar`
- create persistent Docker volumes
- create `.env` if missing
- detect the server IP for `NEXTAUTH_URL`
- restore `nexlab.db` if present
- start NexLab on `http://localhost`

On first launch, open `/setup` to initialize the application and create the
first admin account.

## Updating an Installed App

Build or copy the new `nexlab-image.tar` into `nexlab-install/`, then run:

```powershell
.\update.ps1
```

or on Linux/macOS:

```bash
bash update.sh
```

If you changed `.env`, recreate the container so Docker reloads the variables:

```powershell
docker compose down
docker compose up -d --force-recreate
```

For LAN access from phones or other PCs, set:

```env
NEXTAUTH_URL=http://YOUR_SERVER_IP
AUTH_URL=http://YOUR_SERVER_IP
USE_SECURE_COOKIES=false
AUTH_TRUST_HOST=true
```

Then recreate the container.

## Developer Setup

### Requirements

- Node.js 20+
- npm
- SQLite-compatible local environment

### Install

Windows:

```powershell
copy .env.example .env
npm install
npx prisma generate
npm run dev
```

Linux / macOS:

```bash
cp .env.example .env
npm install
npx prisma generate
npm run dev
```

Open:

```text
http://localhost:3000
```

Then visit `/setup` to create the first admin account.

### Useful Commands

```bash
npm run dev
npm run build
npm run lint
npm test
npm run test:e2e
npx prisma migrate dev
npx prisma migrate deploy
npx prisma generate
```

## Environment Variables

Minimum local development values:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="generate-a-strong-base64-secret"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
USE_SECURE_COOKIES=false
```

Recommended production/offline values:

```env
AUTH_SECRET="32-byte-base64-secret"
SEAL_SECRET="32-byte-base64-secret"
INTERNAL_PRINT_TOKEN="random-hex-token"
NEXTAUTH_URL="http://SERVER_IP_OR_DOMAIN"
AUTH_URL="http://SERVER_IP_OR_DOMAIN"
AUTH_TRUST_HOST="true"
USE_SECURE_COOKIES=false
DATABASE_ENCRYPTION_KEY="64-hex-character-key"
BACKUP_ENCRYPTION_KEY="64-hex-character-key"
```

Notes:

- Use `USE_SECURE_COOKIES=false` for local HTTP/LAN deployments.
- Use secure cookies only behind HTTPS.
- Keep `DATABASE_ENCRYPTION_KEY` and `BACKUP_ENCRYPTION_KEY` outside the lab
  machine as well, for disaster recovery.
- `INTERNAL_PRINT_TOKEN` protects internal PDF/print generation routes. In the
  Docker compose files it can fall back to `AUTH_SECRET`, but a dedicated token
  is preferred.

## Docker Compose

For self-hosted development or local server deployment:

```bash
cp .env.example .env
docker compose up -d --build
```

Data is stored in Docker volumes:

- `nexlab-db`: SQLite database
- uploads volume or mounted upload folder depending on compose file

Use the built-in backup and recovery-bundle tools for off-machine backups.

## Building the Offline Installer

From the repository root:

```powershell
.\scripts\build-offline-installer.ps1
```

or:

```bash
bash scripts/build-offline-installer.sh
```

This builds the Docker image and exports it as:

```text
nexlab-install/nexlab-image.tar
```

Zip or copy the `nexlab-install/` folder to the target machine.

## Project Structure

```text
app/
  (app)/                 Main authenticated application pages
  (print)/               Print-only pages and report rendering routes
  api/                   REST API routes grouped by auth, clinical, management,
                         quality, and system domains
components/
  analyses/              Analysis creation, result entry, validation UI
  print/                 Report and print templates
  qc/                    Quality control UI
  inventory/             Inventory UI
  patients/              Patient UI
  tests/                 Test catalog, ordering, import, LOINC helpers
  database-settings/     Backup, recovery, and database supervision UI
  ui/                    Shared UI primitives
lib/
  analysis/              Analysis lifecycle, status, history, updates
  clinical/              Calculations, validation, QC readiness, formulas
  db/                    Prisma, backups, integrity, recovery bundles
  security/              Auth, audit, license, CSRF, validation seal
  inventory/             Inventory business logic
  documents/             PDF/report/document helpers
prisma/
  schema.prisma
  migrations/
scripts/
  Installer, backup, migration, demo, recovery, and maintenance scripts
tests/
  unit/
  e2e/
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.2 App Router |
| Runtime | React 19 |
| Language | TypeScript 5 |
| Database | SQLite with Prisma ORM 7 |
| Styling | Tailwind CSS 4 |
| Auth | NextAuth.js v5 |
| UI Icons | Lucide React |
| Charts | Recharts |
| PDF/Print | Puppeteer Core, Chromium, print routes |
| Tests | Vitest and Playwright |
| Deployment | Docker and Docker Compose |

## Troubleshooting

### Login works on server but not on phone

Set `.env` to the same URL used by the phone:

```env
NEXTAUTH_URL=http://192.168.1.50
AUTH_URL=http://192.168.1.50
USE_SECURE_COOKIES=false
AUTH_TRUST_HOST=true
```

Then run:

```powershell
docker compose down
docker compose up -d --force-recreate
```

Clear site cookies on the phone and retry.

### Internal print token warning

Add:

```env
INTERNAL_PRINT_TOKEN="random-hex-token"
```

Then recreate the container. Docker compose can fall back to `AUTH_SECRET`, but
a dedicated token is cleaner.

### Database encryption warning

Add a 64-character hex key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use it as `DATABASE_ENCRYPTION_KEY`. Keep it secure. Without it, encrypted
database backups cannot be restored.

## License

NexLab LIMS is proprietary software.

The source code in this repository is made available for transparency and
evaluation only. You may not copy, redistribute, sublicense, or deploy NexLab
commercially without a valid license key issued by the author.

Commercial deployment requires a per-installation license. Each license is
cryptographically bound to the target machine.

## Commercial Licensing

NexLab uses an offline, machine-bound licensing system.

- Each installation has a unique Machine ID.
- A license key is issued by the author for that Machine ID.
- Without a valid license, the application enters read-only mode.
- Trial, annual, and lifetime licenses can be issued.

For licensing inquiries, contact the author directly.

## Motto

NexLab: precision and care in every result.
