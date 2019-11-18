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
        body: PropTypes.string.isRequired
      })
    ),
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

  handleCommentSubmit = event => {
    event.preventDefault();
    const { newComment } = this.state;
    const { dispatch, card } = this.props;
    const commentId = shortid.generate();

    console.log("here", newComment, commentId);

    dispatch({
      type: "ADD_COMMENT",
      payload: {
        cardId: card._id,
        comment: newComment,
        commentId
      }
    });

    this.setState({ newComment: ""});
  };

  handleChange = event => {
    this.setState({ newComment: event.target.value });
  };

  render() {
    const { card, board, comments } = this.props;
    const { newComment } = this.state;
    const checkboxes = findCheckboxes(card.text);

    const commentsList = comments.map(comment => 
      <li
        key={comment._id}
        dangerouslySetInnerHTML={{
          __html: formatMarkdown(comment.body)
        }}
      />
    );
    
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
            <div className="">{board.title}</div>
          </Link>

          <div
            dangerouslySetInnerHTML={{
              __html: formatMarkdown(card.text)
            }}
          >
          </div>
          <h2>Comments</h2>
          <ul>
            {commentsList}
          </ul>
          <form onSubmit={this.handleCommentSubmit} class="card-form">
            <Textarea
              value={newComment}
              onChange={this.handleChange}
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
  return { card: card, board: board, comments: comments };
};

export default connect(mapStateToProps)(CardContainer);
