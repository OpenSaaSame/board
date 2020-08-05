import os
import logging
import uuid
import time

import dazl
from dazl import create, exercise, exercise_by_key

dazl.setup_default_logger(logging.INFO)

class Board:
    App = "OpenworkBoard.V4.Admin"
    UserSession = "OpenworkBoard.V4.UserSession"


def main():
    url = os.getenv('DAML_LEDGER_URL')
    party = os.getenv('DAML_LEDGER_PARTY')

    network = dazl.Network()
    network.set_config(url=url)

    logging.info(f'starting the operator_bot for party {party}')
    client = network.aio_party(party)

    # Check for any outstanding user sessions
    @client.ledger_ready()
    def create_operator(event):  # pylint: disable=unused-variable
        logging.info(f'On Ledger Ready')
        res = client.find_active(Board.App)
        logging.info(f'found {len(res)} Board Admin contracts')

        if len(res) == 0:
            logging.info(f'Creating Operator contract for {party}...')
            return client.submit_create_and_exercise(Board.App, { 'operator': client.party }, "StartApp", {})

        user_sessions = client.find_active(Board.UserSession)
        logging.info(f'found {len(user_sessions)} UserSession contracts')
        return [exercise(cid, 'UserSessionAck') for cid in user_sessions.keys()]

    # Once app is initialized, onboard any pending users
    @client.ledger_created(Board.App)
    def invite_users(event):  # pylint: disable=unused-variable
        logging.info(f'On Board app created!')
        user_sessions = client.find_active(Board.UserSession)
        logging.info(f'found {len(user_sessions)} UserSession contracts')
        return [exercise(cid, 'UserSessionAck') for cid in user_sessions.keys()]

    # As new users sign up, automatically add them to the app
    @client.ledger_created(Board.UserSession)
    def invite_user_to_app(event): 
        logging.info(f'On UserSession created!')
        logging.info(f'Onboarding {event.cdata["user"]}...')
        return client.submit_exercise(event.cid, "UserSessionAck")
    
    network.run_forever()


if __name__ == '__main__':
    main()
