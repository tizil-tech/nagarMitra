[Uploading README.md…]()
# NagarMitra --- Civic Grievance Management Platform

NagarMitra is a mobile-first civic grievance platform for India.
Citizens can report local problems, attach evidence, pin locations on a
map, and track progress. Officials can manage assigned grievances, while
administrators manage departments, assignments, campaigns, and platform
activity.

## Table of Contents

-   [Features](#features)
-   [Technology Stack](#technology-stack)
-   [Project Structure](#project-structure)
-   [Requirements](#requirements)
-   [Local Setup](#local-setup)
-   [Environment Variables](#environment-variables)
-   [CSV Storage](#csv-storage)
-   [Grievance Workflow](#grievance-workflow)
-   [Roles and Permissions](#roles-and-permissions)
-   [Maps](#maps)
-   [AI Chatbot with Groq](#ai-chatbot-with-groq)
-   [Deploying on Render](#deploying-on-render)
-   [Persistent Storage on Render](#persistent-storage-on-render)
-   [Security Checklist](#security-checklist)
-   [Testing Checklist](#testing-checklist)
-   [Limitations and Future
    Improvements](#limitations-and-future-improvements)

## Features

### Citizen

-   Register and log in.
-   Submit a grievance with category, title, description, photo, and
    location.
-   Select a location using Leaflet and OpenStreetMap.
-   Receive a unique grievance tracking ID.
-   View grievance status and update timeline.
-   View resolution notes and evidence when provided.
-   Receive in-app notifications when a relevant grievance update is
    recorded.
-   Join community campaigns and submit feedback on resolved grievances.
-   Use the NagarMitra AI assistant for help navigating the platform and
    preparing grievance descriptions.

### Official

-   View grievances assigned to their department or account, subject to
    backend authorization.
-   Review complaint details and submitted evidence.
-   Update status and add progress notes.
-   Add resolution evidence where supported.

### Administrator

-   Manage departments and official accounts.
-   Assign grievances to departments or officials.
-   Manage campaigns.
-   View dashboard statistics and grievance activity.
-   Review complaint progress and escalations where implemented.

### Interface

-   Mobile-first citizen experience.
-   Responsive desktop layout for officials and administrators.
-   Main navigation: Home, Dashboard, Campaigns, Departments, Feedback.
-   Interactive Leaflet map for grievance locations.
-   In-app notifications only; no SMS or WhatsApp notifications.

> Features listed above should be verified against the current source
> code before treating every item as implemented. This README describes
> the intended product and deployment architecture.

## Technology Stack

-   Frontend: HTML5, CSS3, Vanilla JavaScript
-   Backend: Python and Flask
-   Data storage: CSV files
-   Mapping: Leaflet.js with OpenStreetMap tiles
-   AI chatbot: Groq API through the Flask backend
-   Production server: Gunicorn
-   Hosting: Render Web Service
-   Persistent files: Render Persistent Disk, if configured

No Supabase or SQL database is required for the selected CSV-based
design.

## Project Structure

Expected structure (actual filenames may differ in the current
repository):

``` text
NagarMitra/
├── app.py
├── requirements.txt
├── .gitignore
├── README.md
├── templates/
│   ├── index.html
│   ├── dashboard.html
│   ├── campaigns.html
│   ├── departments.html
│   ├── feedback.html
│   ├── login.html
│   ├── register.html
│   └── ... other templates
├── static/
│   ├── css/
│   ├── js/
│   └── images/
├── storage/              # Local development CSV data
├── uploads/              # Local development uploaded files
└── __pycache__/          # Generated; do not commit
```

In production, configure the app to use a persistent data directory such
as `/var/data`, rather than relying on the repository's `storage/` or
`uploads/` folders.

## Requirements

-   Python 3.10 or newer (use the version supported by your dependencies
    and Render runtime).
-   pip
-   Git
-   A Groq API key if the AI chatbot is enabled.
-   A Render account for deployment.
-   A GitHub repository connected to Render.

## Local Setup

### 1. Open the project directory

``` bash
cd NagarMitra
```

### 2. Create and activate a virtual environment

Windows PowerShell:

``` powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
```

Windows Command Prompt:

``` bat
py -m venv .venv
.venv\Scripts\activate.bat
```

macOS/Linux:

``` bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

Create or update `requirements.txt` with the packages actually imported
by the project. A typical Flask deployment may require:

``` text
Flask
gunicorn
groq
```

Install them:

``` bash
pip install -r requirements.txt
```

Do not add packages that the code does not use. If the app imports
additional libraries, include those dependencies in `requirements.txt`.

### 4. Configure environment variables

Set the variables listed in [Environment
Variables](#environment-variables). Never commit secrets to Git.

### 5. Run the application

If the Flask instance in `app.py` is named `app`:

``` bash
python app.py
```

Open the local URL printed by Flask, commonly `http://127.0.0.1:5000`.

## Environment Variables

Recommended configuration:

  -----------------------------------------------------------------------
  Variable                Required                Purpose
  ----------------------- ----------------------- -----------------------
  `SECRET_KEY`            Yes in production       Flask session signing
                                                  key; use a long random
                                                  secret

  `PORT`                  Supplied by Render      Port on which the web
                                                  server listens

  `FLASK_DEBUG`           No                      Set to `false` in
                                                  production

  `DATA_DIR`              Recommended             Directory for
                                                  persistent CSV data

  `UPLOAD_DIR`            Recommended             Directory for uploaded
                                                  images/evidence

  `GROQ_API_KEY`          Only if chatbot enabled Private Groq API key

  `GROQ_MODEL`            Only if chatbot enabled Model ID supported by
                                                  the Groq account
  -----------------------------------------------------------------------

Example local `.env` file (only if the project loads `.env` using a
package such as `python-dotenv`):

``` dotenv
SECRET_KEY=replace-with-a-long-random-secret
FLASK_DEBUG=true
DATA_DIR=storage
UPLOAD_DIR=uploads
GROQ_API_KEY=replace-with-your-groq-api-key
GROQ_MODEL=openai/gpt-oss-120b
```

Do not publish `.env` or place `GROQ_API_KEY` in frontend JavaScript,
HTML, or a public repository. Add secrets through Render's Environment
settings.

The model ID above is an example configuration. Check the current [Groq
model catalogue](https://console.groq.com/docs/models) and your
account's access before deployment. If the model is unavailable, select
a currently supported model and update `GROQ_MODEL`.

## CSV Storage

CSV is appropriate for a prototype or small demonstration, but it is not
a transactional database. The application should:

-   Create each CSV file and its header only when the file does not
    already exist.
-   Never overwrite existing records at startup.
-   Validate all data before writing.
-   Use file locking and safe/atomic writes for read-modify-write
    operations.
-   Keep private files outside the publicly served `static/` directory.
-   Back up the data directory regularly.
-   Avoid running multiple app instances against the same CSV files
    unless writes are coordinated safely.

Suggested data files, if these match the application's implementation:

-   `users.csv`
-   `grievances.csv`
-   `grievance_updates.csv`
-   `departments.csv`
-   `campaigns.csv`
-   `campaign_participants.csv`
-   `feedback.csv`
-   `notifications.csv`

The exact schema must match the code. Do not rename columns or files
without updating all corresponding read/write logic.

## Grievance Workflow

A typical grievance lifecycle is:

1.  Citizen submits the issue, category, description, evidence, and
    location.
2.  Backend validates the request and generates a unique grievance ID.
3.  Grievance data is saved to CSV storage.
4.  The grievance is assigned to a department or appears in an
    authorized unassigned queue.
5.  An authorized official reviews the grievance and posts updates.
6.  Each status change is added to the grievance update history.
7.  The citizen sees the current status and timeline on the tracking
    page.
8.  When resolved, the official records resolution details and evidence.
9.  The citizen can submit feedback if the grievance is eligible.

The UI must not claim a grievance was submitted, assigned, or resolved
until the backend confirms the operation.

## Roles and Permissions

Use server-side authorization for every protected endpoint.

-   `citizen`: manage their own profile and grievances; view only data
    they are allowed to access; submit eligible feedback.
-   `official`: access and update grievances within the authorized
    department or assignment scope.
-   `admin`: manage platform resources and assignments.

Hiding a button or changing a page layout is not an authorization
mechanism. Validate the authenticated user's role and resource ownership
on the backend for each protected request.

## Maps

The platform uses Leaflet.js with OpenStreetMap tiles.

-   Store coordinates as numeric latitude and longitude values.
-   Request browser location only after user permission.
-   Allow manual location selection on the map.
-   Validate coordinates on the backend.
-   Show only public-safe grievance information in public map markers.
-   Do not expose private contact details or exact sensitive addresses
    unnecessarily.
-   Follow the tile provider's usage policy and attribution
    requirements.

## AI Chatbot with Groq

The chatbot should call Groq from the Flask backend, never directly from
the browser.

Recommended configuration:

``` python
import os
from groq import Groq

api_key = os.environ.get("GROQ_API_KEY")
model = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")

client = Groq(api_key=api_key)
```

Use the configured `model` in the existing Groq chat completion request.
This snippet is a configuration example, not a replacement for the
project's full chatbot route.

The assistant can: - Explain how to submit a grievance. - Help select a
category. - Help rewrite a complaint description clearly. - Explain
statuses and how to track a grievance.

It must not invent grievance IDs, claim to have submitted a complaint
without backend confirmation, or disclose private user records. Add rate
limiting, input limits, error handling, and safe logging. Never log API
keys or sensitive chat content unnecessarily.

If a Groq key has been exposed publicly or pasted into a public
repository, revoke/rotate it and update Render's environment variable.

## Deploying on Render

### 1. Prepare Git

Create a `.gitignore` file such as:

``` gitignore
__pycache__/
*.py[cod]
.venv/
venv/
.env
```

Do not commit production user data, private uploads, API keys, or
session secrets.

Commit and push the project:

``` bash
git init
git add .
git commit -m "Prepare NagarMitra for deployment"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

If Git is already configured, do not repeat `git init` or
`git remote add`.

### 2. Create a Render Web Service

1.  Open the [Render Dashboard](https://dashboard.render.com/).
2.  Choose **New → Web Service**.
3.  Connect the GitHub repository.
4.  Select the appropriate Python runtime.
5.  Configure the commands below.

  Render setting      Value
  ------------------- --------------------------------------
  Build command       `pip install -r requirements.txt`
  Start command       `gunicorn app:app`
  Health check path   `/health`, only if this route exists

The command `gunicorn app:app` assumes the Python file is `app.py` and
the Flask application object is named `app`. Change it if your filename
or object name differs.

### 3. Confirm the Flask entry point

The existing application may use:

``` python
if __name__ == "__main__":
    init_csvs()
    port = int(os.environ.get("PORT", 5000))
    app.run(
        host="0.0.0.0",
        port=port,
        debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    )
else:
    init_csvs()
```

This allows CSV initialization when running directly and when Gunicorn
imports the module. Ensure `init_csvs()` only creates missing files and
does not erase existing data.

### 4. Configure Render environment variables

In the Render service's **Environment** settings, add:

``` text
SECRET_KEY=<long-random-secret>
FLASK_DEBUG=false
DATA_DIR=/var/data
UPLOAD_DIR=/var/data/uploads
GROQ_API_KEY=<your-private-groq-key>
GROQ_MODEL=openai/gpt-oss-120b
```

Only configure Groq variables if the chatbot is enabled. Your Python
code must read `DATA_DIR` and `UPLOAD_DIR`; Render environment variables
alone do not redirect file writes.

### 5. Configure persistent storage

Render's default filesystem is ephemeral. To retain CSV data and
uploaded evidence across restarts and deploys:

1.  Add a persistent disk to a supported Render service.
2.  Mount it at `/var/data`.
3.  Configure the app to write CSV files under `/var/data` and uploads
    under `/var/data/uploads`.
4.  Verify permissions and that all data-access code uses these paths.
5.  Back up important records.

Review [Render Persistent Disks](https://render.com/docs/disks) for
current availability, limitations, and pricing. Without persistent
storage, files written to the instance can be lost.

### 6. Verify deployment

After deployment, open the Render URL and test:

-   Home page and navigation.
-   Registration, login, logout, and role restrictions.
-   Grievance submission, photo upload, map coordinates, and tracking.
-   Official assignment and status updates.
-   Citizen in-app notifications.
-   Campaigns, departments, and feedback.
-   Chatbot responses and graceful API failure handling.
-   Data retention after a service restart, if a persistent disk is
    configured.

Inspect Render's build and runtime logs if deployment fails. Fix the
first underlying error rather than masking it.

## Security Checklist

-   [ ] Use a strong production `SECRET_KEY`.
-   [ ] Keep all secrets in environment variables.
-   [ ] Hash passwords with a secure password-hashing utility.
-   [ ] Enforce roles and ownership in backend routes.
-   [ ] Validate upload types, sizes, and generated filenames.
-   [ ] Prevent CSV formula injection when exporting data.
-   [ ] Protect state-changing requests against CSRF where cookie-based
    authentication is used.
-   [ ] Do not serve CSV storage or private uploads as public static
    files.
-   [ ] Apply safe file writes and backups.
-   [ ] Limit chatbot request rates and input sizes.
-   [ ] Do not expose private grievance data through public map markers
    or APIs.

## Testing Checklist

### Functional

-   [ ] Citizen can submit and track a grievance.
-   [ ] Unique grievance IDs are generated.
-   [ ] Officials can update only authorized grievances.
-   [ ] Every status update appears in the tracking timeline.
-   [ ] Citizens receive in-app notifications for relevant updates.
-   [ ] Admin department and assignment operations work.
-   [ ] Feedback is accepted only when permitted.

### Responsive

-   [ ] Test at 320px, 375px, 390px, and 430px widths.
-   [ ] Mobile navigation opens and closes properly.
-   [ ] Dashboard statistics remain readable.
-   [ ] Forms and maps fit without horizontal overflow.
-   [ ] Admin and official interfaces remain usable on desktop.

### Deployment and persistence

-   [ ] Gunicorn starts without import errors.
-   [ ] Static files load correctly.
-   [ ] API routes use the deployed host.
-   [ ] CSV files are not reset on startup.
-   [ ] Persistent disk paths are used for data and uploads.
-   [ ] No secrets appear in source control or browser requests.

## Limitations and Future Improvements

CSV storage is simple, portable, and useful for a prototype, but it
lacks database transactions, indexing, robust concurrent-write handling,
and multi-instance coordination. For a production civic service with
real citizen data and multiple officials, plan a migration to a
transactional database and formal backup/recovery procedures.

Other potential improvements include: - Duplicate grievance detection. -
Department service-level deadlines and escalation rules. - Audit logs
for administrative actions. - Accessibility improvements and
multilingual support. - Data retention and privacy policies. - Automated
tests and monitoring.

## Useful Links

-   [Render Web Services](https://render.com/docs/web-services)
-   [Render Persistent Disks](https://render.com/docs/disks)
-   [Render Flask Deployment](https://render.com/docs/deploy-flask)
-   [Groq Models](https://console.groq.com/docs/models)
-   [Groq API Documentation](https://console.groq.com/docs)
-   [Leaflet Documentation](https://leafletjs.com/reference.html)
-   [OpenStreetMap Tile Usage
    Policy](https://operations.osmfoundation.org/policies/tiles/)

------------------------------------------------------------------------

**Project:** NagarMitra\
**Purpose:** Civic grievance reporting and resolution tracking\
**Deployment target:** Render\
**Storage:** CSV files on configured persistent storage\
**Frontend:** HTML, CSS, Vanilla JavaScript\
**Backend:** Python Flask
