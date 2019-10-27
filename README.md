<!-- Description: A Trello-like application built with React and Redux. Take a look at the live website:  -->

# Danban

A Kanban board backed by a DAML Ledger, inspired by [Trello](https://trello.com/home) and based on [react-kanban](https://github.com/markusenglund/react-kanban).

![react kanban example](https://github.com/digital-asset/danban/blob/master/example.gif?raw=true)

[Check out the live website](https://danban.daml.com)

### Features

* It has most of the features available on Trello, like creating and editing new cards, dragging around cards and so on.
* Supports GitHub flavored markdown, which enables stuff like headings and checklists on the cards.
* Works great on touch devices.
* Public and private boards, with sharing functionality
* Fully backed by a DAML Ledger

### Tech stack

* [React](https://github.com/facebook/react)
* [Redux](https://github.com/reactjs/redux)
* [React-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd)
* [Sass](https://github.com/sass/sass)
* [Webpack](https://github.com/webpack/webpack)
* [Babel](https://github.com/babel/babel)
* [Express](https://github.com/expressjs/express)
* [Passport](https://github.com/jaredhanson/passport)
* [DAML](https://daml.com)


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
cd danban

daml start --sandbox-option="--ledgerid=danban" --sandbox-option="-w"
```

#### Set up Environment
You need auth credentials for the Google sign in. You need to create a file with the name `.env` in the root directory with the following variables:

```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

# Has to be True for Sandbox mode
USE_SANDBOX="True"

# Has to be port 1337
ROOT_URL=http://127.0.0.1:1337

```

#### Run in dev mode

```shell
npm run build:watch
npm run serve:watch
```

#### Run in test mode

```shell
npm run build
npm run serve
```

#### Run in prod mode

```shell
npm run build:prod
npm run serve:prod
```

### Run on Project DABL

To run on DABL, you need a DABL Ledger with the DAML model deployed. You also need the refresh cookie for the ledger admin account. Then add the following two
variables to your environment and remove `USE_SANDBOX`:

```shell
REFRESH_COOKIE="__DABL_SESSION={YOUR_COOKIE}"
DABL_LEDGER="{DABL_LEDGER_ID}"
```

