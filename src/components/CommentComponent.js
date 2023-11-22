import React from "react";

const CommentComponent = ({ comments, addComment }) => {
  return (
    <div>
      <h3>Comments:</h3>
      <ul>
        {comments.map((comment, index) => (
          <li key={index}>{comment}</li>
        ))}
      </ul>
      <button onClick={addComment}>Add Comment</button>
    </div>
  );
};

export default CommentComponent;
