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
- [project : DABL](https://projectdabl.com)

### Development

You need

- the [DAML SDK](https://docs.daml.com/getting-started/installation.html)
- Node.js v12

#### Clone & Install Dependencies

```shell
git clone https://github.com/digital-asset/danban.git
cd danban
```

#### Start DAML Sandbox

```shell
cd danban/V2 && daml build
cd danban/V2Bugfix && daml build
cd danban/V3 && daml build

cd danban/Upgrade/V3

daml start --sandbox-option="--ledgerid=danban" --sandbox-option="-w"
```

#### Run the client

```shell
cd client
yarn install
yarn start
```
