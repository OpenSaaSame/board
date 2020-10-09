# OpenWork Board

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

You need the following software to be installed to run a local app:

- The [DAML SDK](https://docs.daml.com/getting-started/installation.html)
- Node.js v13.8.0
- [Honcho](https://pypi.org/project/honcho/)

Honcho is a tool for easily running multiple processes as a group, and
used here to simplify running the six processes that comprise a local
app environment. The
[Procfile](https://github.com/digital-asset/danban/blob/master/.gitignore)
at the root of the project specifies the processes that are run by
Honcho. While running, Honcho aggregates the logs of each in a single
stream and terminates the entire group if any individual process
terminates.

#### Clone & Install Dependencies

```shell
git clone https://github.com/OpenSaaSame/board.git
cd board
```

#### Build and Start

```shell
make run
```

Once the app is running, it will present a login window that asks for a
party and JWT token. The local build mints two local JWT tokens that
can be used to authenticate and prints them to the log stream:

```
13:46:47 quickstart.1 | [   INFO] 2020-06-16 13:46:47,134 | root    | App ledger ready
13:46:47 quickstart.1 | [   INFO] 2020-06-16 13:46:47,176 | root    | JWT for 'Alice' => 'eyJhbGc...'
13:46:47 quickstart.1 | [   INFO] 2020-06-16 13:46:47,177 | root    | JWT for 'Bob' => 'eyJhbGciO...'
```

Please be aware of the fact that the local app runs
against an in-memory ledger. The contents of this ledger do not
persist after the environment is shut down.

#### Building the model from scratch

If you want to build the model from scratch, run `daml build` in the following folders under `backend`: `V2`, `V2Bugfix`, `V3`, `Upgrade/V3`. The resulting `.dar` will be in `backend/Upgrade/V3/.daml/dist`

#### Run the client

```shell
cd client
npm install
npm start
```
