import React from "react";
import { Link } from "react-router-dom";
import noimg from "../assets/no-image.png";
import { api } from "../config";
import DeleteIcon from "@mui/icons-material/Delete";

function Itemcard({ id, title, description, image, onDelete }) {
  return (
    <div className="item-card" data-aos="fade-up">
      <Link to={`/find/details/${id}`}>
        <div className="img-container">
          <img
            src={image ? `${api}/files/${image}` : noimg}
            alt=""
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = noimg;
            }}
          />
        </div>
        <div className="content">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </Link>
      <button 
        onClick={(e) => {
          e.preventDefault();
          onDelete();
        }}
        className="delete-btn"
      >
        <DeleteIcon />
      </button>
    </div>
  );
}

export default Itemcard;