dar_version := 3.2.0
operator_bot_version := $(shell cd python ; pipenv run python operator/setup.py --version)
ui_version := $(shell node -p "require(\"./client/package.json\").version")

dar := target/ow-board-model-$(dar_version).dar
operator_bot := target/ow-board-operator-bot-$(operator_bot_version).tar.gz
ui := target/ow-board-ui-$(ui_version).zip

.PHONY: package
package: all
	cd target && zip openwork-board.zip * && rm ow-*


.PHONY: run
run: all
	honcho start


.PHONY: all
all: $(operator_bot) $(dar) $(ui)


$(dar):
	mkdir -p $(@D)
	cp backend/released/danban-$(dar_version).dar $@


$(operator_bot):
	cd python/operator; pipenv run python setup.py sdist
	rm -fr python/operator/openwork_board_operator_bot.egg-info
	mkdir -p $(@D)
	mv python/operator/dist/openwork-board-operator-bot-$(operator_bot_version).tar.gz $@
	rm -r python/operator/dist


$(ui):
	cd client; \
		npm install; \
		npm run build; \
		zip -r ow-board-ui-$(ui_version).zip build
	mkdir -p $(@D)
	mv client/ow-board-ui-$(ui_version).zip $@

.PHONY: clean
clean:
	rm -fr python/operator/openwork_board_operator_bot.egg-info \
		python/operator/dist \
		target/* \
		client/build
