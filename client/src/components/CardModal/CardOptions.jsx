import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import Modal from "react-modal";
import { FaTrash, FaUser, FaCommentAlt, FaTags } from "react-icons/fa";
import { MdAlarm } from "react-icons/md";
import Calendar from "./Calendar";
import ClickOutside from "../ClickOutside/ClickOutside";
import "./CardOptions.scss";
import CardUser from "./CardUser";
import CardComments from "./CardComments";
import CardTags from "./CardTags";

class CardOptions extends Component {
  static propTypes = {
    isColorPickerOpen: PropTypes.bool.isRequired,
    card: PropTypes.shape({ _id: PropTypes.string.isRequired }).isRequired,
    listId: PropTypes.string.isRequired,
    isCardNearRightBorder: PropTypes.bool.isRequired,
    isThinDisplay: PropTypes.bool.isRequired,
    boundingRect: PropTypes.object.isRequired,
    toggleColorPicker: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired
  };

  constructor() {
    super();
    this.state = {
      isCalendarOpen: false,
      isCommentsOpen: false,
      isTagsOpen: false
    };
  }

  deleteCard = () => {
    const { dispatch, listId, card } = this.props;
    dispatch({
      type: "DELETE_CARD",
      payload: { cardId: card._id, listId }
    });
  };

  changeColor = color => {
    const { dispatch, card, toggleColorPicker } = this.props;
    if (card.color !== color) {
      dispatch({
        type: "CHANGE_CARD_COLOR",
        payload: { color, cardId: card._id }
      });
    }
    toggleColorPicker();
    this.colorPickerButton.focus();
  };

  handleKeyDown = event => {
    if (event.keyCode === 27) {
      this.props.toggleColorPicker();
      this.colorPickerButton.focus();
    }
  };

  handleClickOutside = () => {
    const { toggleColorPicker } = this.props;
    toggleColorPicker();
    this.colorPickerButton.focus();
  };

  toggleCalendar = () => {
    this.setState({ isCalendarOpen: !this.state.isCalendarOpen });
  };

  toggleComments = () => {
    this.setState({ isCommentsOpen: !this.state.isCommentsOpen });
  }

  toggleTags = () => {
    this.setState({ isTagsOpen: !this.state.isTagsOpen });
  }

  render() {
    const {
      isCardNearRightBorder,
      isColorPickerOpen,
      toggleColorPicker,
      card,
      isThinDisplay,
      boundingRect
    } = this.props;
    const { isCalendarOpen, isCommentsOpen, isTagsOpen } = this.state;

    const calendarStyle = {
      content: {
        top: Math.min(boundingRect.bottom + 10, window.innerHeight - 300),
        left: boundingRect.left
      }
    };

    const calendarMobileStyle = {
      content: {
        top: 150,
        left: "50%",
        transform: "translateX(-50%)"
      }
    };

    const commentsMobileStyle = {
      content: {
        position: "relative",
        left: 0,
        top: 0,
        marginTop: 150,
        padding: 8
      }
    }

    return (
      <div
        className="options-list"
        style={{
          alignItems: isCardNearRightBorder ? "flex-end" : "flex-start"
        }}
      >
        <>
          <div>
            <button onClick={this.toggleComments} className="options-list-button">
              <div className="modal-icon">
                <FaCommentAlt />
              </div>&nbsp;Comments
            </button>
          </div>
          <Modal
            isOpen={isCommentsOpen}
            onRequestClose={this.toggleComments}
            overlayClassName="calendar-underlay"
            className="calendar-modal"
            style={isThinDisplay ? commentsMobileStyle : calendarStyle}
          >
            <CardComments cardId={card._id} />
          </Modal>
          <div>
            <button onClick={this.toggleTags} className="options-list-button">
              <div className="modal-icon">
                <FaTags />
              </div>&nbsp;Tags
            </button>
          </div>
          <Modal
            isOpen={isTagsOpen}
            onRequestClose={this.toggleTags}
            overlayClassName="calendar-underlay"
            className="calendar-modal"
            style={isThinDisplay ? commentsMobileStyle : calendarStyle}
          >
            <CardTags cardId={card._id} />
          </Modal>
          <div className="options-list-button">
            <div className="modal-icon">
              <FaUser />
            </div>
            &nbsp;<CardUser cardId={card._id} assignee={card.assignee} />
          </div>
        </>
        <div>
          <button onClick={this.deleteCard} className="options-list-button">
            <div className="modal-icon">
              <FaTrash />
            </div>&nbsp;Delete
          </button>
        </div>
        <div className="modal-color-picker-wrapper">
          <button
            className="options-list-button"
            onClick={toggleColorPicker}
            onKeyDown={this.handleKeyDown}
            ref={ref => {
              this.colorPickerButton = ref;
            }}
            aria-haspopup
            aria-expanded={isColorPickerOpen}
          >
            <img src={'/images/color-icon.png'} alt="colorwheel" className="modal-icon" />
            &nbsp;Color
          </button>
          {isColorPickerOpen && (
            <ClickOutside
              eventTypes="click"
              handleClickOutside={this.handleClickOutside}
            >
              {/* eslint-disable */}
              <div
                className="modal-color-picker"
                onKeyDown={this.handleKeyDown}
              >
                {/* eslint-enable */}
                {["white", "#6df", "#6f6", "#ff6", "#fa4", "#f66"].map(
                  color => (
                    <button
                      key={color}
                      style={{ background: color }}
                      className="color-picker-color"
                      onClick={() => this.changeColor(color)}
                    />
                  )
                )}
              </div>
            </ClickOutside>
          )}
        </div>
        <div>
          <button onClick={this.toggleCalendar} className="options-list-button">
            <div className="modal-icon">
              <MdAlarm />
            </div>&nbsp;Due date
          </button>
        </div>
        <Modal
          isOpen={isCalendarOpen}
          onRequestClose={this.toggleCalendar}
          overlayClassName="calendar-underlay"
          className="calendar-modal"
          style={isThinDisplay ? calendarMobileStyle : calendarStyle}
        >
          <Calendar
            cardId={card._id}
            date={card.date}
            toggleCalendar={this.toggleCalendar}
          />
        </Modal>
      </div>
    );
  }
}

export default connect()(CardOptions);
