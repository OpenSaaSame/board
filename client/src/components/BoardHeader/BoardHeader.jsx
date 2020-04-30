import React from "react";
import BoardTitle from "./BoardTitle";
import ColorPicker from "./ColorPicker";
import BoardDeleter from "./BoardDeleter";
import SharingModal from "./Sharing/SharingModal";
import "./BoardHeader.scss"
import BoardAbout from "./BoardAbout";

const BoardHeader = (props) => (
  <div className="board-header">
    <BoardTitle hasAdmin={props.hasAdmin} />
    { props.hasAdmin &&
      <div className="board-header-right">
        <SharingModal />
        <ColorPicker />
        <BoardAbout hasAdmin={props.hasAdmin} />
        <BoardDeleter />
      </div>
    }
  </div>
);

export default BoardHeader;
