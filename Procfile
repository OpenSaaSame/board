sandbox: cd backend/V4 && daml start --sandbox-option="--ledgerid=openwork-board" --sandbox-option="-w"
operator: sleep 10 && cd python/operator && DAML_LEDGER_URL=http://localhost:6865 DAML_LEDGER_PARTY=Admin pipenv run python bot/operator_bot.py
client: sleep 10 && cd client && npm start
