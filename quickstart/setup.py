import dazl

url = "http://localhost:6865/"
party = 'Admin'

network = dazl.Network()
network.set_config(url=url)
client = network.aio_party(party)

@client.ledger_ready()
def ensure_setup(event):
    print('Starting the app')
    return client.submit_create('Danban.V3.Admin', {'operator': client.party})

@client.ledger_created('Danban.V3.Admin')
def init_app(event):
    print('Initializing users')
    appId = event.cid

    commands = [
        dazl.exercise(appId, 'StartApp'),
        dazl.exercise(appId, 'PauseApp'),
        dazl.exercise(appId, 'AddUser', {'party': 'Alice'}),
        dazl.exercise(appId, 'UnpauseApp')
    ]

    return client.submit(commands)

network.run_forever()
