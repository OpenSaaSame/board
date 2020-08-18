import React from "react";
import BoardTitle from "./BoardTitle";
import ColorPicker from "./ColorPicker";
import BoardDeleter from "./BoardDeleter";
import SharingModal from "./Sharing/SharingModal";
import "./BoardHeader.scss"
import BoardAbout from "./BoardAbout";
import BoardFilter from "./BoardFilter";

const BoardHeader = (props) => (
  <div className="board-header">
    <BoardTitle hasAdmin={props.hasAdmin} />
      <div className="board-header-right">
        { props.hasAdmin &&
          <>
            <SharingModal />
            <ColorPicker />
            <BoardDeleter />
          </>
        }
        <BoardFilter />
        <BoardAbout hasAdmin={props.hasAdmin} />
      </div>
  </div>
);

export default BoardHeader;
