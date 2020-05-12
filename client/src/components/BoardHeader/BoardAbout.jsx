import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Button, Wrapper, Menu } from "react-aria-menubutton";
import PropTypes from "prop-types";
import { FaInfoCircle } from "react-icons/fa";
import marked from "marked";
import Textarea from "react-textarea-autosize";
import "./BoardAbout.scss";

class BoardAbout extends Component {

  static propTypes = {
    boardId: PropTypes.string.isRequired,
    about: PropTypes.string,
    dispatch: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      newAbout: props.about
    };
  }

  handleSubmit = event => {
    event.preventDefault();
    const { newAbout } = this.state;
    const { dispatch, boardId } = this.props;

    dispatch({
      type: "CHANGE_BOARD_ABOUT",
      payload: {
        boardId,
        about: newAbout
      }
    });
  };

  handleChange = event => {
    this.setState({ newAbout: event.target.value });
  };

  handleKeyDown = event => {
    if (event.keyCode === 13 && event.shiftKey === false) {
      this.handleSubmit(event);
    }
  };

  render() {
    const { about, hasAdmin } = this.props;
    const { newAbout } = this.state;

    if ((about === "" && !hasAdmin) || about === undefined) {
      return null;
    }

    const adminContent = (
      <form onSubmit={this.handleSubmit} >
        <Textarea
          value={newAbout}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          minRows={3}
        />
        <input type="submit" value="Update" />
      </form>
    );

    const aboutContent = (
      <div
        dangerouslySetInnerHTML={{
          __html: marked(about)
        }}
      />
    );

    return (
      <Wrapper
        className="board-about-wrapper"
        onSelection={this.handleSelection}
      >
        <Button className="board-about">
          <FaInfoCircle />
          <div className="board-header-right-text">
            &nbsp;About &nbsp;&#9662;
          </div>
        </Button>
        <Menu className="board-about-menu">
          { hasAdmin ? adminContent : aboutContent }
        </Menu>
      </Wrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { boardId } = ownProps.match.params;
  return {
    boardId, about: state.boardsById[boardId].about
  };
};

export default withRouter(connect(mapStateToProps)(BoardAbout));
