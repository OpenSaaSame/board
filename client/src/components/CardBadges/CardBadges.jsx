import React, { Component } from "react";
import PropTypes from "prop-types";
import { format, parseISO } from "date-fns";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import { MdAccessAlarm, MdDoneAll } from "react-icons/md";
import "./CardBadges.scss";

class CardBadges extends Component {
  static propTypes = {
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    checkboxes: PropTypes.shape({
      total: PropTypes.number.isRequired,
      checked: PropTypes.number.isRequired
    }).isRequired,
    assignee: PropTypes.object,
    tags: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired
      })
    )
  };

  renderDueDate = () => {
    if (!this.props.date) {
      return null;
    }
    
    const date = new Date(Date.parse(this.props.date));
    const dueDateFromToday = differenceInCalendarDays(date, new Date());

    let dueDateString;
    if (dueDateFromToday < -1) {
      dueDateString = `${Math.abs(dueDateFromToday)} days ago`;
    } else if (dueDateFromToday === -1) {
      dueDateString = "Yesterday";
    } else if (dueDateFromToday === 0) {
      dueDateString = "Today";
    } else if (dueDateFromToday === 1) {
      dueDateString = "Tomorrow";
    } else {
      dueDateString = format(date, "d MMM");
    }

    let dueDateColor;
    if (dueDateFromToday < 0) {
      dueDateColor = "red";
    } else if (dueDateFromToday === 0) {
      dueDateColor = "#d60";
    } else {
      dueDateColor = "green";
    }

    return (
      <div className="badge" style={{ background: dueDateColor }}>
        <MdAccessAlarm className="badge-icon" style={{verticalAlign: 'middle'}} />&nbsp;
        {dueDateString}
      </div>
    );
  };

  // Render badge showing amoung of checkboxes that are checked
  renderTaskProgress = () => {
    const { total, checked } = this.props.checkboxes;
    if (total === 0) {
      return null;
    }
    return (
      <div
        className="badge"
        style={{ background: checked === total ? "green" : "#444" }}
      >
        <MdDoneAll className="badge-icon" style={{verticalAlign: 'middle'}} />&nbsp;
        {checked}/{total}
      </div>
    );
  };

  renderAssignee = () => {
    const { assignee } = this.props;
    if (assignee !== undefined) {
      return (
        <span
          className="badge user-badge"
        >
          {assignee.displayName}
        </span>
      );
    } else {
      return null;
    }
  };

  renderTags = () => {
    const { tags } = this.props;

    if (tags !== undefined) {
      // TODO: Figure out why some tags are undefined
      return tags.filter(tag => tag !== undefined).map(tag =>
        <div
          className="badge"
          key={tag._id}
          style={{backgroundColor: "#" + tag.color}}
        >
          {tag.name}
        </div>
      )
    } else {
      return null;
    }
  };

  render() {
    return (
      <div className="card-badges">
        {this.renderDueDate()}
        {this.renderTaskProgress()}
        {this.renderAssignee()}
        {this.renderTags()}
      </div>
    );
  }
}

export default CardBadges;
