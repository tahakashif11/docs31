import React from "react";

const Comment = ({ comment, onDelete }) => {
  return (
    <div className="comment">
      <p>{comment.text}</p>
      <button onClick={onDelete}>Delete Comment</button>
    </div>
  );
};

export default Comment;
