import React from "react";
import BoardTitle from "./BoardTitle";
import ColorPicker from "./ColorPicker";
import BoardDeleter from "./BoardDeleter";
import AccessModal from "./AccessModal";
import "./BoardHeader.scss";

const BoardHeader = (props) => (
  <div className="board-header">
    <BoardTitle />
    <div className="board-header-right">
      { props.hasAdmin &&  <AccessModal /> }
      { props.hasAdmin &&  <div className="vertical-line" /> }
      <ColorPicker />
      <div className="vertical-line" />
      <BoardDeleter />
    </div>
  </div>
);

export default BoardHeader;
