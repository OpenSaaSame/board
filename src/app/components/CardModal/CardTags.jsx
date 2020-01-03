import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import shortid from "shortid";
import "./CardTags.scss"

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
    cardTags: PropTypes.arrayOf(
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
      newTagName: "",
      newTagColor: ""
    };
  }

  handleSubmit = event => {
    event.preventDefault();
    const { newTagName, newTagColor } = this.state;
    const { dispatch, boardId } = this.props;
    const tagId = shortid.generate();

    if (newTagName != "") {
      dispatch({
        type: "ADD_TAG",
        payload: {
          name: newTagName,
          color: newTagColor,
          tagId,
          boardId
        }
      });
    }

    this.setState({ newTagName: "", newTagColor: ""});
  };

  handleSelect = (event, tag) => {
    event.preventDefault();
    const { cardId, cardTags, dispatch } = this.props;

    if (cardTags.includes(tag)) {
      console.log("Unassigning");
      dispatch({
        type: "UNASSIGN_TAG",
        payload: {
          cardId,
          tagId: tag._id
        }
      });
    } else {
      dispatch({
        type: "ASSIGN_TAG",
        payload: {
          cardId,
          tagId: tag._id
        }
      });
    }
  }

  handleNameChange = event => {
    this.setState({ newTagName: event.target.value });
  };

  handleColorChange = event => {
    this.setState({ newTagColor: event.target.value });
  };

  handleKeyDown = event => {
    if (event.keyCode === 13) {
      this.handleSubmit(event);
    }
  };

  render() {
    const { tags } = this.props;
    const { newTagName, newTagColor } = this.state;

    const tagList = tags.map(tag => {
      return  <div>
                <button
                  className="tag-button"
                  key={tag._id}
                  style={{backgroundColor: "#" + tag.color}}                
                  onClick={event => this.handleSelect(event, tag)}
                >
                  {tag.name}
                </button>
              </div>
    });
    
    return (
      <div className="card-container tag-container">
        {tagList}
        <form onSubmit={this.handleSubmit} className="card-form">
          <div>
            <label>Tag name:</label>
            <input
              type="text"
              value={newTagName}
              onChange={this.handleNameChange}
              onKeyDown={this.handleKeyDown}
            />
          </div>
          <div>
            <label>Tag color (hex):</label>
            <input
              type="text"
              value={newTagColor}
              onChange={this.handleColorChange}
              onKeyDown={this.handleKeyDown}
            />
          </div>
          <input type="submit" value="Save" />
        </form>
      </div>
    );
  }
}

const mapStateToProps = (state, { cardId }) => {
  const boardId = state.cardsById[cardId].boardId;
  const cardTags = state.cardsById[cardId].tags.map(tagId => state.tagsById[tagId]);
  const board = state.boardsById[boardId];
  const tags = board.tags.map(tagId => state.tagsById[tagId]);
  return { cardId, boardId, tags, cardTags };
};

export default connect(mapStateToProps)(CardTags);
