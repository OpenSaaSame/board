# OpenWork board

A Kanban board backed by a DAML ledger, inspired by
[Trello](https://trello.com/home) and based on
[react-kanban](https://github.com/markusenglund/react-kanban).

[Check out the live website](https://board.opensaasame.org)

### Features

- It has most of the features available on Trello, like creating and editing new
  cards, dragging around cards and so on.
- Supports GitHub flavored markdown, which enables stuff like headings and
  checklists on the cards.
- Works great on touch devices.
- Public and private boards, with sharing functionality
- Fully backed by a DAML ledger

### Tech stack

- [React](https://github.com/facebook/react)
- [Redux](https://github.com/reactjs/redux)
- [React-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd)
- [Sass](https://github.com/sass/sass)
- [Webpack](https://github.com/webpack/webpack)
- [Babel](https://github.com/babel/babel)
- [Express](https://github.com/expressjs/express)
- [Passport](https://github.com/jaredhanson/passport)
- [DAML](https://daml.com)
- [project : DABL](https://projectdabl.com)

### Development

You need

- the [DAML SDK](https://docs.daml.com/getting-started/installation.html)
- A Google Cloud project with API access for Google Auth
- Node.js v12

#### Clone & Install Dependencies

```shell
git clone https://github.com/digital-asset/danban.git
cd danban
npm install
```

#### Start DAML Sandbox

```shell
daml build --project-root danban/V2
daml build --project-root danban/V2Bugfix
daml build --project-root danban/V3

cd danban/Upgrade/V3

daml start --sandbox-option="--ledgerid=danban" --sandbox-option="-w"
```

#### Set up Environment

You need auth credentials for the Google sign in. You need to create a file with
the name `.env` in the root directory with the following variables:

```
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Has to be True for Sandbox mode
USE_SANDBOX="True"

# If $PORT is unset it will default to 1337
ROOT_URL=http://127.0.0.1:1337

```

#### Run in dev mode

```shell
npm run build:watch
npm run start:watch
```

#### Run in test mode

```shell
npm run build
npm run start
```

#### Run in prod mode

```shell
npm run build:prod
npm run start:prod
```

### Run on Project DABL

[DABL](https://projectdabl.com/) is a cloud hosted runtime for DAML code. To
deploy your models create an account, log in, and create a new ledger. You'll
need to create a .dar of the DAML model:

```
cd danban/Upgrade/V3
daml build
```

Upload the .dar `danban/Upgrade/V3/.daml/dist/danban-upgrade-3.0.0.dar` to the
new ledger.

Using the `Dockerfile` generate a Docker image and upload to your preferred host
(for example, GCP Run). The environment variables should be as follows:

```shell
GOOGLE_CLIENT_ID="{GOOGLE_CLIENT_ID}"
GOOGLE_CLIENT_SECRET="{GOOGLE_CLIENT_SECRET}"
DABL_LEDGER="{DABL_LEDGER_ID}"
DABL_ADMIN="{DABL_PARTY_ID}"
REFRESH_COOKIE="DABL_SESSION={YOUR_COOKIE}"
```
The `REFRESH_COOKIE` can be found by inspecting your browser cookies for
`login.projectdabl.com`. If there are 2, it will be the one for the `/auth`
path.
