import os
import logging
import uuid
import time

import dazl
from dazl import create, exercise, exercise_by_key

dazl.setup_default_logger(logging.INFO)

class Board:
    # TODO: remove legacy package support
    # App = "Danban.V3.Admin@006a15901a809f6096f4fe706d94e913676f01e821c30d8c0b4e01d1885aba83"
    # UserSession = "Danban.V3_1.UserSession@f4c6953996ded4065367a73d1fd5de89e9c2bf2d9079a52560b18ce071032f7b"
    # UserRole = "Danban.V3.Role.User@006a15901a809f6096f4fe706d94e913676f01e821c30d8c0b4e01d1885aba83"
    # Data = "Danban.V3.Board.Data@006a15901a809f6096f4fe706d94e913676f01e821c30d8c0b4e01d1885aba83"

    App = "Danban.V3.Admin"
    UserSession = "Danban.V3_1.UserSession"
    UserRole = "Danban.V3.Role.User"
    Data = "Danban.V3.Board.Data"


def main():
    url = os.getenv('DAML_LEDGER_URL')
    party = os.getenv('DAML_LEDGER_PARTY')

    network = dazl.Network()
    network.set_config(url=url)

    logging.info(f'starting the operator_bot for party {party}')
    client = network.aio_party(party)

    # Check for any outstanding user sessions and update users on any public boards
    @client.ledger_ready()
    def create_operator(event):  # pylint: disable=unused-variable
        logging.info(f'On Ledger Ready')
        res = client.find_active(Board.App)
        logging.info(f'found {len(res)} Board Admin contracts')

        if len(res) == 0:
            logging.info(f'Creating Operator contract for {party}...')
            return client.submit_create_and_exercise(Board.App, { 'operator': client.party }, "StartApp", {})

        boards = client.find_active(Board.Data)
        logging.info(f'found {len(res)} boards')
        update_board_commands = [exercise(cid, "Data_UpdatePublic") for cid in boards.keys()]

        user_sessions = client.find_active(Board.UserSession)
        logging.info(f'found {len(user_sessions)} UserSession contracts')
        onboard_user_commands = [exercise(cid, 'UserSessionAck') for cid in user_sessions.keys()]

        return update_board_commands + onboard_user_commands

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
    
    # Once new users are onboarded, add them to public boards
    @client.ledger_created(Board.UserRole)
    def add_user_to_public_boards(event): #pylint: disable=unused-variable
        logging.info(f'On new user created!')
        boards = client.find_active(Board.Data)
        return [exercise(cid, "Data_UpdatePublic") for cid in boards.keys()]

    network.run_forever()


if __name__ == '__main__':
    main()
