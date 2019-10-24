import React from "react";
import BoardTitle from "./BoardTitle";
import ColorPicker from "./ColorPicker";
import BoardDeleter from "./BoardDeleter";
import AccessModal from "./AccessModal";
import "./BoardHeader.scss";

const BoardHeader = () => (
  <div className="board-header">
    <BoardTitle />
    <div className="board-header-right">
      <AccessModal />
      <div className="vertical-line" />
      <ColorPicker />
      <div className="vertical-line" />
      <BoardDeleter />
    </div>
  </div>
);

export default BoardHeader;
