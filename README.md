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
- [DAML](https://daml.com)
- [project:DABL](https://projectdabl.com)

### Development

You need the following software to be installed to run a local Danban
environment.

- The [DAML SDK](https://docs.daml.com/getting-started/installation.html)
- Node.js v13.8.0

#### Clone & Install Dependencies

```shell
git clone https://github.com/digital-asset/danban.git
cd danban
```

#### Build and Start Danban

```shell
make run
```

Once Danban is running, it will present a login window that asks for a
party and JWT token. [How to create JWTs can be found in the DAML
documemtation](https://docs.daml.com/json-api/index.html#choosing-a-party),
but for reference here are some tokens for Alice and Bob:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2RhbWwuY29tL2xlZGdlci1hcGkiOnsibGVkZ2VySWQiOiJkYW5iYW4iLCJhcHBsaWNhdGlvbklkIjoiZm9vYmFyIiwiYWN0QXMiOlsiQWxpY2UiXX19.o-OCSkNCHiPAnScBaIqzmLFmSu3WZTpU9prQEvi82fo
```

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2RhbWwuY29tL2xlZGdlci1hcGkiOnsibGVkZ2VySWQiOiJkYW5iYW4iLCJhcHBsaWNhdGlvbklkIjoiZm9vYmFyIiwiYWN0QXMiOlsiQm9iIl19fQ.jPzJsB4MPjYIOm4PC46tqrjAip0RztZvd7FS5Vbnc5U
```

Please be aware of the fact that the local Danban environment runs
against an in-memory ledger. The contents of this ledger do not
persist after the environment is shut down.

#### Building the model from scratch

If you want to build the model from scratch:

```shell
cd backend/V4
daml build
```

The resulting `.dar` will be in `backend/Upgrade/V4/.daml/dist`

#### Run the client

```shell
cd client
npm install
npm start
```
