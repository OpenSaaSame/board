import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { findCheckboxes } from "../utils";
import formatMarkdown from "./formatMarkdown";
import "./Card.scss";
import { Title } from "react-head";
import Header from "../Header/Header";
import Textarea from "react-textarea-autosize";
import slugify from "slugify";
import { Link } from "react-router-dom";
import shortid from "shortid";

class CardContainer extends Component {
  static propTypes = {
    card: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      color: PropTypes.string
    }).isRequired,
    board: PropTypes.shape({
      title: PropTypes.string.isRequired,
      _id: PropTypes.string.isRequired
    }).isRequired,
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        body: PropTypes.string.isRequired,
        author: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired
      })
    ),
    userId: PropTypes.string.isRequired,
    allUsers: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired
  };

  constructor() {
    super();
    this.state = {
      isModalOpen: true,
      newComment: ""
    };
  }
  
  // identify the clicked checkbox by its index and give it a new checked attribute
  toggleCheckbox = (checked, i) => {
    const { card, dispatch } = this.props;

    let j = 0;
    const newText = card.text.replace(/\[(\s|x)\]/g, match => {
      let newString;
      if (i === j) {
        newString = checked ? "[x]" : "[ ]";
      } else {
        newString = match;
      }
      j += 1;
      return newString;
    });

    dispatch({
      type: "CHANGE_CARD_TEXT",
      payload: { cardId: card._id, cardText: newText }
    });
  };

  handleSubmit = event => {
    event.preventDefault();
    const { newComment } = this.state;
    const { dispatch, card, userId } = this.props;
    const commentId = shortid.generate();
    const createdAt = Date.now().toString();

    dispatch({
      type: "ADD_COMMENT",
      payload: {
        cardId: card._id,
        comment: newComment,
        commentId,
        createdAt,
        author: userId
      }
    });

    this.setState({ newComment: ""});
  };

  handleChange = event => {
    this.setState({ newComment: event.target.value });
  };

  handleKeyDown = event => {
    if (event.keyCode === 13 && event.shiftKey === false) {
      this.handleSubmit(event);
    }
  };

  render() {
    const { card, board, comments, allUsers } = this.props;
    const { newComment } = this.state;
    const checkboxes = findCheckboxes(card.text);

    const commentsList = comments.map(comment => {
      const dateString = new Date(comment.createdAt).toDateString();

      return  <div
                key={comment._id}
                className="card-comment"
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: formatMarkdown(comment.body)
                  }}
                />
                <div className="card-comment-metadata">
                  {allUsers.byParty[comment.author].email} &mdash; {dateString}
                </div>
              </div>
    });
    
    return (
      <>
        <Title>Danban</Title>
        <Header />
        <div className="card-container">
          <Link
            key={board._id}
            className=""
            to={`/b/${board._id}/${slugify(board.title, {
              lower: true
            })}`}
          >
            Back to board: {board.title}
          </Link>
          
          <h1>Card</h1>

          <div
            className="card-body"
            dangerouslySetInnerHTML={{
              __html: formatMarkdown(card.text)
            }}
          >
          </div>
          
          <div className="class-comments">
            <h2>Comments</h2>
            {commentsList}
          </div>

          <form onSubmit={this.handleSubmit} className="card-form">
            <Textarea
              value={newComment}
              onChange={this.handleChange}
              onKeyDown={this.handleKeyDown}
              minRows={3}
            />
            <input type="submit" value="Submit" />
          </form>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { cardId } = ownProps.match.params;
  const card = state.cardsById[cardId];
  const board = state.boardsById[card.boardId];
  const comments = card.comments.map(cId => state.commentsById[cId]);
  const userId = state.user ? state.user.party : "guest";
  const allUsers = state.users;
  return { card, board, comments, userId, allUsers };
};

export default connect(mapStateToProps)(CardContainer);
