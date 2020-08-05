sandbox: cd backend/V4 && daml start --sandbox-options --ledgerid=danban -w
operator: sleep 10 && cd python/operator && DAML_LEDGER_URL=http://localhost:6865 DAML_LEDGER_PARTY=Admin python3 -m bot
client: sleep 10 && cd client && npm start
