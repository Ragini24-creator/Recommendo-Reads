import React from "react";
import StarRating from "./StarRating";
import RecommendationContainer from "./RecommendedBook";

export default function BookDetails({
  receivedData,
  selectedBook,
  onClickBookDetail,
  onClickRating,
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-window">
        <div className="modal-content">
          <div className="modal-content-img-div">
            <img
              src={selectedBook.image_link}
              alt={selectedBook.title}
              width="200"
              height="300"
            />
          </div>
          <div className="modal-content-second-div">
            <h1>{selectedBook.title}</h1>
            <h2>{selectedBook.author}</h2>
            <span>
              {selectedBook.categories[1]}
              <span>,</span>
              {selectedBook.categories[2]}
            </span>
            <StarRating
              size={25}
              className="star-rating"
              onClick={() => onClickRating(selectedBook.title)}
            />
            <p>{selectedBook.description}</p>
            <button onClick={onClickBookDetail}>Close</button>
          </div>
        </div>

        {receivedData.length > 0 && (
          <>
            <h2 className="recommended-for-you-heading">Recommended for you</h2>
            <div className="recommendation-container-wrapper">
              <div className="recommendation-container">
                <RecommendationContainer receivedData={receivedData} />
              </div>
            </div>
            )
          </>
        )}
      </div>
    </div>
  );
}
