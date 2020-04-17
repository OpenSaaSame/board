import { loadState, exercise as exerciseUtil, create, rootErr } from "./ledgerUtils"

const makeLedgerUrl = () => {
    if (window.location.hostname === 'localhost') {
        return '/v1/';
    }

    // Generate DABL URL from the location
    let host = window.location.host.split('.')
    const ledgerId = host[0];
    let apiUrl = host.slice(1)
    apiUrl.unshift('api')

    return 'https://' +  apiUrl.join('.') + (window.location.port ? ':' + window.location.port : '') + '/data/' + ledgerId;
}

export const createUserSession = async (jwt, party, email, displayName) => {
    // get admin ID
    var admin;
    if (window.location.hostname === 'localhost') {
        admin = "Admin";
    } else {
        const dablInfo = await JSON.parse(await fetch("/.well-known/dabl.json"));
        admin = dablInfo["userAdminParty"];
    }
    await create(makeLedgerUrl(), jwt, "Danban.V3_1:UserSession", { operator: admin, user: party, email, displayName });
    window.location.reload();
};


export const upgrade = user => exerciseUtil(
    makeLedgerUrl(),
    user.token,
    `${user.version}.Upgrade:UpgradeInvite`,
    user.cid,
    "Accept_Upgrade", {}
);

export const exercise = (user, choice, args) => {
    if (user.cid) {
        exerciseUtil(
            makeLedgerUrl(),
            user.token,
            `${user.version}.Role:User`,
            user.cid,
            choice,
            args
        )
    }
};

const isNetworkError = err =>
    rootErr(err) instanceof TypeError;

const handleAction = async(dispatch, pAction) => {
    try {
        await pAction;
        dispatch({
            type: "SUCCEED_WRITE",
            payload: {}
        });
    } catch (err) {
        if (isNetworkError(err)) {
            dispatch({
                type: "NETWORK_ERROR",
                payload: { err: rootErr(err) }
            });
            setTimeout(() => dispatch({
                type: "NETWORK_RETRY",
                payload: {}
            }), 10000)
        } else {
            dispatch({
                type: "FAIL_WRITE",
                payload: { err }
            });
        }
    }
}

const maybeWrite = (state, dispatch) => {
    const {
        ledger
    } = state;

    if ((ledger.network.error && !ledger.network.retry) || ledger.write.queue.length === 0 || ledger.write.inProgress) return;

    dispatch({
        type: "START_WRITE",
        payload: {}
    });

    const action = ledger.write.queue[0];
    const actionFn = exerciseUserChoice(action.type);

    handleAction(dispatch, actionFn(state, action.payload));
}

const exerciseUserChoice = (choice) => (state, payload) => exercise(
    state.user,
    choice,
    payloadTransform[choice](payload)
)

const payloadTransform = {
    "ADD_BOARD": payload => ({ boardId: payload.boardId, title: payload.boardTitle }),
    "TOGGLE_PUBLIC": payload => payload,
    "CHANGE_PERMISSIONS": payload => payload,
    "ADD_USER": payload => payload,
    "REMOVE_USER": payload => payload,
    "PutProfile": payload => ({ displayName: payload.displayName, imageUrl: "" }),
    "DELETE_BOARD": payload => payload,
    "CHANGE_BOARD_TITLE": payload => ({ boardId: payload.boardId, newTitle: payload.boardTitle }),
    "CHANGE_BOARD_COLOR": payload => ({ boardId: payload.boardId, newColor: payload.color }),
    "CHANGE_BOARD_ABOUT": payload => ({ boardId: payload.boardId, newAbout: payload.about }),
    "ADD_LIST": payload => ({ boardId: payload.boardId, title: payload.listTitle, listId: payload.listId }),
    "DELETE_LIST": payload => ({ boardId: payload.boardId, listId: payload.listId }),
    "MOVE_LIST": payload => ({ boardId: payload.boardId, oldIdx: payload.oldListIndex, newIdx: payload.newListIndex }),
    "CHANGE_LIST_TITLE": payload => ({ listId: payload.listId, newTitle: payload.listTitle }),
    "ADD_CARD": payload => ({ listId: payload.listId, cardId: payload.cardId, text: payload.cardText }),
    "MOVE_CARD": payload => ({ sourceListId: payload.sourceListId, destListId: payload.destListId, oldIdx: payload.oldCardIndex, newIdx: payload.newCardIndex }),
    "DELETE_CARD": payload => ({ listId: payload.listId, cardId: payload.cardId }),
    "CHANGE_CARD_TEXT": payload => ({ cardId: payload.cardId, newText: payload.cardText }),
    "CHANGE_CARD_DATE": payload => ({ cardId: payload.cardId, newDate: payload.date }),
    "CHANGE_CARD_COLOR": payload => ({ cardId: payload.cardId, newColor: payload.color }),
    "CHANGE_CARD_ASSIGNEE": payload => ({ cardId: payload.cardId, assignee: payload.assignee }),
    "REMOVE_CARD_ASSIGNEE": payload => ({ cardId: payload.cardId }),
    "ADD_COMMENT": payload => ({ cardId: payload.cardId, commentId: payload.commentId, comment: payload.comment }),
    "ADD_TAG": payload => ({ boardId: payload.boardId, tagId: payload.tagId, name: payload.name, color: payload.color }),
    "ASSIGN_TAG": payload => ({ cardId: payload.cardId, tagId: payload.tagId }),
    "UNASSIGN_TAG": payload => ({ cardId: payload.cardId, tagId: payload.tagId })
}

const dispatchStates = async(store, remoteState) => {
    try {
        const state = await remoteState;

        //If there are changes in flight, queue another read.
        if (store.getState().ledger.read.cancelled) {
            store.dispatch({
                type: "CANCEL_READ",
                payload: {}
            });
            return;
        }
        store.dispatch({
            type: "SUCCEED_READ",
            payload: state
        });
    } catch (err) {
        if (isNetworkError(err)) {
            store.dispatch({
                type: "NETWORK_ERROR",
                payload: { err: rootErr(err) }
            });
            setTimeout(() => store.dispatch({
                type: "NETWORK_RETRY",
                payload: {}
            }), 10000)
        } else {
            // If reading goes wrong for other reasons,
            // log out and reload to get a fresh UI and token.
            store.dispatch({
                type: "LOG_OUT"
            })
            window.location.reload();
        }
    }
}

const maybeRead = (store) => {
    const {
        ledger,
        user
    } = store.getState();

    if ((ledger && ledger.network.error && !ledger.network.retry) ||
        ledger.read.inProgress ||
        ledger.write.queue.length > 0 ||
        !ledger.read.queued) return;

    store.dispatch({
        type: "START_READ",
        payload: {}
    });

    dispatchStates(store, loadState(makeLedgerUrl(), user.token, user.party));
}

// Persist the board to the database after almost every action.
const persistMiddleware = store => next => action => {
    next(action);
    const state = store.getState();
    const {
        user
    } = state;

    // Nothing is persisted for guest users, or users needing upgrades
    if (user) {
        switch (action.type) {
            case "ADD_BOARD":
            case "TOGGLE_PUBLIC":
            case "ADD_USER":
            case "REMOVE_USER":
            case "PutProfile":
            case "CHANGE_PERMISSIONS":
            case "DELETE_BOARD":

            case "CHANGE_BOARD_TITLE":
            case "CHANGE_BOARD_COLOR":
            case "CHANGE_BOARD_ABOUT":
            case "ADD_TAG":

            case "ADD_LIST":
            case "DELETE_LIST":
            case "MOVE_LIST":
            case "CHANGE_LIST_TITLE":

            case "ADD_CARD":
            case "MOVE_CARD":
            case "DELETE_CARD":

            case "CHANGE_CARD_TEXT":
            case "CHANGE_CARD_DATE":
            case "CHANGE_CARD_COLOR":
            case "CHANGE_CARD_ASSIGNEE":
            case "REMOVE_CARD_ASSIGNEE":
            case "ASSIGN_TAG":
            case "UNASSIGN_TAG":

            case "ADD_COMMENT":
                if (!user.needsUpgrade)
                    store.dispatch({
                        type: "QUEUE_WRITE",
                        payload: {
                            type: action.type,
                            payload: action.payload
                        }
                    });
                break;

            case "QUEUE_READ":
            case "SUCCEED_READ":
            case "CANCEL_READ":
                maybeRead(store);
                break;
            case "SUCCEED_WRITE":
            case "NETWORK_RETRY":
                maybeWrite(state, store.dispatch);
                maybeRead(store);
                break;
            case "FAIL_WRITE":
            case "QUEUE_WRITE":
                maybeWrite(state, store.dispatch);
                break;
            default:
                break;
        }
    }
};

export default persistMiddleware;