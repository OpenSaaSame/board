sandbox: daml sandbox --ledgerid=danban -w quickstart/danban-v3-1-3.1.0.dar

jsonapi: sleep 10 && daml json-api --ledger-host=localhost --ledger-port=6865 --http-port=7575 --allow-insecure-tokens
navigator: sleep 10 && daml navigator server
client: sleep 10 && cd client && npm start
operator: sleep 10 && cd python/operator && DAML_LEDGER_URL=http://localhost:6865 DAML_LEDGER_PARTY=Admin python3 -m bot

quickstart: sleep 20 && python3 quickstart/setup.py
