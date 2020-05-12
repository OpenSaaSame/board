PYTHON := pipenv run python

dar_version := $(shell grep "^version" backend/V3_1/daml.yaml | sed 's/version: //g')
operator_bot_version := $(shell pipenv run python python/operator/setup.py --version)
ui_version := $(shell node -p "require(\"./client/package.json\").version")

dar := target/ow-board-model-$(dar_version).dar
operator_bot := target/ow-board-operator-bot-$(operator_bot_version).tar.gz
ui := target/ow-board-ui-$(ui_version).zip

.PHONY: package
package: $(operator_bot) $(dar) $(ui)
	cd target && zip ow-board.zip *


$(dar):
	cd backend/V3; daml build
	cd backend/V3_1; daml build
	mkdir -p $(@D)
	mv backend/V3_1/.daml/dist/*.dar $@


$(operator_bot):
	cd python/operator && $(PYTHON) setup.py sdist
	rm -fr python/operator/openwork_board_operator_bot.egg-info
	mkdir -p $(@D)
	mv python/operator/dist/openwork-board-operator-bot-$(operator_bot_version).tar.gz $@
	rm -r python/operator/dist


$(ui):
	cd client; \
		yarn install; \
 		yarn build; \
		zip -r ow-board-ui-$(ui_version).zip build
	mkdir -p $(@D)
	mv client/ow-board-ui-$(ui_version).zip $@
	rm -r client/build

.PHONY: clean
clean:
	rm -fr python/operator/openwork_board_operator_bot.egg-info python/operator/dist target/*
