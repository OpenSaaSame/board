import os
import logging
import uuid
import time

import dazl
from dazl import create, exercise, exercise_by_key

dazl.setup_default_logger(logging.INFO)

def main():
    url = os.getenv('DAML_LEDGER_URL')
    party = os.getenv('DAML_LEDGER_PARTY')

    network = dazl.Network()
    network.set_config(url=url)

    logging.info(f'starting the operator_bot for party {party}')
    client = network.aio_party(party)

    # Start the app if not already initialized
    @client.ledger_ready()
    def create_operator(event):  # pylint: disable=unused-variable
        logging.info(f'On Ledger Ready')
        res = client.find_active("Danban.V3.Admin")
        logging.info(f'found {len(res)} Board Admin contracts')

        if not res:
            logging.info(f'Creating Operator contract for {party}...')
            return client.submit_create("Danban.V3.Admin", { 'operator': client.party })
        else:
            logging.info(f'Operator {party} is ready')
            user_sessions = client.find_active("Danban.V3_1.UserSession")
            logging.info(f'found {len(user_sessions)} UserSession contracts')
            return [exercise(cid, 'UserSessionAck') for cid in user_sessions.keys()]

    # Once app is initialized, onboard any pending users
    @client.ledger_created("Danban.V3.Admin")
    def invite_users(event):  # pylint: disable=unused-variable
        logging.info(f'On Board app created!')
        user_sessions = client.find_active("Danban.V3_1.UserSession")
        logging.info(f'found {len(user_sessions)} UserSession contracts')

        return [exercise(cid, 'UserSessionAck') for cid in user_sessions.keys()]

    # As new users sign up, automatically add them to the app
    @client.ledger_created("Danban.V3_1.UserSession")
    def invite_user_to_chat(event):  # pylint: disable=unused-variable
        logging.info(f'On UserSession created!')

        logging.info(f'Onboarding {event.cdata["user"]}...')
        return client.submit_exercise(event.cid, "UserSessionAck")

    network.run_forever()


if __name__ == '__main__':
    main()
