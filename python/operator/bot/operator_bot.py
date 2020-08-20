import os
import logging
import uuid
import time

import dazl
from dazl import create, exercise, exercise_by_key

dazl.setup_default_logger(logging.INFO)

class Board:
    App = "Danban.V3_2.Admin"
    UserSession = "Danban.V3_2.UserSession"
    UserRole = "Danban.V3_2.Role.User"
    Data = "Danban.V3_2.Board.Data"

    OldUpgrade = "Danban.V3_2.Upgrade.UpgradeInvite"
    NewUpgrade = "Danban.V3_2_4.Upgrade.UpgradeInvite"

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

        old_upgrade_invites = client.find_active(Board.OldUpgrade)
        logging.info(f'found {len(old_upgrade_invites)} v3.2 UgradeInvite contracts')
        create_upgrade_commands = [create(Board.NewUpgrade, { 'operator': client.party, 'party': cdata['party'] }) for cdata in old_upgrade_invites.values()]

        return update_board_commands + onboard_user_commands + create_upgrade_commands

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
