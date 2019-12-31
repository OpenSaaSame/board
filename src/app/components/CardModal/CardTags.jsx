import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import shortid from "shortid";
import Textarea from "react-textarea-autosize";

class CardTags extends Component {
  static propTypes = {
    cardId: PropTypes.string.isRequired,
    boardId: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired
      })
    ),
    dispatch: PropTypes.func.isRequired
  };

  constructor() {
    super();
    this.state = {
      newTag: ""
    };
  }

  handleSubmit = event => {
    event.preventDefault();
    const { newTag } = this.state;
    const { dispatch, boardId } = this.props;
    const tagId = shortid.generate();

    if (newTag != "") {
      dispatch({
        type: "ADD_TAG",
        payload: {
          name: newTag,
          color: "#ccc",
          tagId,
          boardId
        }
      });
    }

    this.setState({ newTag: ""});
  };

  handleChange = event => {
    this.setState({ newTag: event.target.value });
  };

  handleKeyDown = event => {
    if (event.keyCode === 13 && event.shiftKey === false) {
      this.handleSubmit(event);
    }
  };

  render() {
    const { tags } = this.props;
    const { newTag } = this.state;

    console.log(tags);

    const tagList = tags.map(tag => {
      return  <div
                key={tag._id}
                className="card-comment"
              >
                {tag.name}
              </div>
    });
    
    return (
      <div className="card-container">
        <form onSubmit={this.handleSubmit} className="card-form">
          <Textarea
            value={newTag}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
          />
          <input type="submit" value="Save" />
        </form>
        {tagList}
      </div>
    );
  }
}

const mapStateToProps = (state, { cardId }) => {
  const boardId = state.cardsById[cardId].boardId;
  const board = state.boardsById[boardId];
  console.log(board);
  const tags = board.tags.map(tagId => state.tagsById[tagId]);
  return { cardId, boardId, tags };
};

export default connect(mapStateToProps)(CardTags);
