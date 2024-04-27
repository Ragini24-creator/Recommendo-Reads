export default function CartRecommendationContainer({ cartRecommendation }) {
  return (
    <>
      <h2 className="cartRecommendation-heading">Based On your cart items</h2>
      <div className="cartRecommendation">
        {cartRecommendation.map((book) => (
          <CartRecommendation book={book} key={book.title} />
        ))}
      </div>
    </>
  );
}

function CartRecommendation({ book }) {
  return (
    <div>
      <img src={book.imageLink} alt={book.title} width="190px" height="250px" />
      <h2>{book.title}</h2>
      <span>{book.author}</span>
      <span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
          width="15"
          height="15"
        >
          <rect width="256" height="256" fill="none" />
          <path
            d="M135.34,28.9l23.23,55.36a8,8,0,0,0,6.67,4.88l59.46,5.14a8,8,0,0,1,4.54,14.07L184.13,147.7a8.08,8.08,0,0,0-2.54,7.89l13.52,58.54a8,8,0,0,1-11.89,8.69l-51.1-31a7.93,7.93,0,0,0-8.24,0l-51.1,31a8,8,0,0,1-11.89-8.69l13.52-58.54a8.08,8.08,0,0,0-2.54-7.89L26.76,108.35A8,8,0,0,1,31.3,94.28l59.46-5.14a8,8,0,0,0,6.67-4.88L120.66,28.9A8,8,0,0,1,135.34,28.9Z"
            fill="#f59f00"
            stroke="#f59f00"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
          />
        </svg>
        {book.rating}
      </span>
    </div>
  );
}
