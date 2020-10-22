DIT_NAME=$(shell ddit targetname)
BASENAME=$(shell ddit targetname --basename)
VERSION=$(shell ddit ditversion)


TAG_NAME=${BASENAME}-v${VERSION}
NAME=${BASENAME}-${VERSION}

operator_bot := target/ow-board-operator-bot-$(VERSION).tar.gz
ui := target/ow-board-ui-$(VERSION).zip

.PHONY: package publish

all: package

publish: package
	ddit release

package: ${DIT_NAME}

${DIT_NAME}: dabl-meta.yaml $(operator_bot) $(ui)
	ddit build \
       --subdeployment $(operator_bot) $(ui) backend/released/danban-3.2.0.dar

.PHONY: run
run: package
	honcho start

.PHONY: all

$(operator_bot):
	cd python/operator; DDIT_VERSION=$(VERSION) pipenv run python setup.py sdist
	rm -fr python/operator/openwork_board_operator_bot.egg-info
	mkdir -p $(@D)
	mv python/operator/dist/openwork-board-operator-bot-$(VERSION).tar.gz $@
	rm -r python/operator/dist


$(ui):
	cd client; \
		npm install; \
		npm run build; \
		zip -r ow-board-ui-$(VERSION).zip build
	mkdir -p $(@D)
	mv client/ow-board-ui-$(VERSION).zip $@

.PHONY: clean
clean:
	rm -fr python/operator/openwork_board_operator_bot.egg-info \
		python/operator/dist \
		target/* \
		client/build
