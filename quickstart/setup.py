import logging

import dazl

from jwcrypto import jwt, jwk

key = jwk.JWK(generate='oct', size=256)

dazl.setup_default_logger(logging.INFO)

def party_jwt(party):
    header = {
        "alg": "HS256",
        "typ": "JWT"
    }

    claims = {
        "sub": "1234567890",
        "name": party,
        "iat": 1516239022,
        "https://daml.com/ledger-api": {
        "ledgerId": "danban",
            "applicationId": "danban",
            "actAs": [party]
        }
    }

    token = jwt.JWT(header=header, claims=claims)
    token.make_signed_token(key)

    return token.serialize()


def show_party_jwt(party):
    logging.info('JWT for %r => %r', party, party_jwt(party))


network = dazl.Network()
network.set_config(url='http://localhost:6865/')
client = network.aio_party('Admin')


@client.ledger_ready()
def ensure_setup(event):
    logging.info('App ledger ready')

    show_party_jwt('Alice')
    show_party_jwt('Bob')


network.run_forever()



