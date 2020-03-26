import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import formatMarkdown from "../Card/formatMarkdown";
import Textarea from "react-textarea-autosize";
import shortid from "shortid";
import "./CardComments.scss";

class CardComments extends Component {
  static propTypes = {
    cardId: PropTypes.string.isRequired,
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
      newComment: ""
    };
  }

  handleSubmit = event => {
    event.preventDefault();
    const { newComment } = this.state;
    const { dispatch, cardId, userId } = this.props;
    const commentId = shortid.generate();
    const createdAt = Date.now().toString();

    if (newComment !== "") {
      dispatch({
        type: "ADD_COMMENT",
        payload: {
          comment: newComment,
          author: userId,
          cardId,
          commentId,
          createdAt
        }
      });
    }

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
    const { comments, allUsers } = this.props;
    const { newComment } = this.state;

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
      <div className="card-container">
        <form onSubmit={this.handleSubmit} className="card-form">
          <Textarea
            value={newComment}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
            minRows={3}
            placeholder="Comment..."
          />
          <input type="submit" value="Save" />
        </form>
        {commentsList}
      </div>
    );
  }
}

const mapStateToProps = (state, { cardId }) => {
  const card = state.cardsById[cardId];
  const comments = card.comments.map(cId => state.commentsById[cId]).reverse();
  const userId = state.user ? state.user.party : "guest";
  const allUsers = state.users;
  return { cardId, comments, userId, allUsers };
};

export default connect(mapStateToProps)(CardComments);
