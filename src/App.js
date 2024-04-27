import { useState, useEffect } from "react";
import Header from "./Header";
import BookContainer from "./BookContainer";
import BookDetails from "./BookDetails";
import CartRecommendationContainer from "./cartRecommendations";
import SearchTop5Container from "./SearchRecommendation";
import SearchHistoryBasedRecommendContainer from "./searchHistoryRecommendation";

export default function App() {
  const [query, setQuery] = useState("");
  // eslint-disable-next-line
  const [searchResult, setSearchResult] = useState([]);
  const [userRating, setUserRating] = useState([]);
  const [SearchRecommendations, setSearchRecommendations] = useState([]); // for most searched book recommendation
  const [bookData1, setBookData1] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedBook, setSelectedBook] = useState("");
  // const [itemsToSendToBackend, setItemsToSendToBackend] = useState("");
  const [receivedData, setReceivedData] = useState([]);
  const [cartRecommendation, setCartRecommendation] = useState([]);
  const [searchHistoryRecommendation, setSearchHistoryRecommendation] =
    useState([]); //for providing books based on recent searches
  let categories = [];

  useEffect(() => {
    async function fetchBooks() {
      try {
        // if (query.trim() === "" || query.length < 2) {
        //   setBookData1([]);
        //   return;
        // }

        const response = await fetch("http://localhost:9000/");

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const data = await response.json();
        console.log(data);
        if (!data.docs || data.docs.length === 0) {
          setBookData1([]);
          return;
        }

        const formattedBooks = data.docs.map((book) => ({
          title: book.title ? book.title : "undefined",
          author: book.author ? book.author : "undefined",
          categories: book.genre ? [...categories, ...book.genre] : "undefined",
          image_link: book.imageLink ? book.imageLink : "undefined",
          description: book.description ? book.description : "undefined",
          rating: book.rating ? book.rating : "undefined",
        }));

        setBookData1(formattedBooks);
        // console.log("FormattedBooks", formattedBooks);
      } catch (error) {
        console.error(error.message);
      }
    }
    fetchBooks();
    // eslint-disable-next-line
  }, []);

  // FOR RECOMMENDATION BASED ON SEARCH HISTORY
  const handleSearch = async () => {
    try {
      // Make a POST request to the backend API to capture the search history and fetch recommendations
      const response = await fetch("http://localhost:9000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Specify that you're sending JSON data
        },
        body: JSON.stringify({ keywords: query }), // Convert query to JSON format and include it in the request body
      });

      // Parse the JSON response
      const responseData = await response.json();

      // Update search result state with response data
      setSearchResult(responseData.searchResult);

      // Update recommendations state with response data
      setSearchRecommendations(responseData.recommendations);
      setSearchHistoryRecommendation(responseData.booksBasedonSearchHistory);
    } catch (error) {
      console.error("Error searching:", error);
    }
  };

  //  FOR HANDLING SEARCHED BOOKS
  const handleSearchedBooks = async () => {
    try {
      // Make a GET request to the backend API to fetch book details based on the search query
      const response = await fetch(
        `http://localhost:9000/search?term=${query}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch book details");
      }

      // Parse the JSON response
      const bookDetails = await response.json();
      const renamedBookDetails = {
        title: bookDetails.title,
        author: bookDetails.author,
        categories: [bookDetails.genre], // Assuming genre is a string or array of strings
        image_link: bookDetails.imageLink,
        description: bookDetails.description,
        rating: bookDetails.rating,
      };

      // Update selected book state with renamed book details
      setSelectedBook(renamedBookDetails);
    } catch (error) {
      console.error("Error searching for book:", error.message);
    }
  };

  // FOR SENDING CART ITEMS TO BACKEND

  async function sendItemsTobackend(itemsToSendToBackend) {
    try {
      const response = await fetch("http://localhost:9000/", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(itemsToSendToBackend),
      });

      const data = await response.json();
      setCartRecommendation(data.bookRecommended);
      // setReceivedData(data.bookRecommended);
    } catch (error) {
      console.error(error.message);
    }
  }

  // Function for adding cart items
  {
    function handleClick(title, author, categories, image, rating) {
      setCartCount((cartCount) => cartCount + 1);
      const updatedItems = [
        ...cartItems,
        { image, title, author, categories, quantity: cartCount, rating },
      ];
      setCartItems(updatedItems);
      sendItemsTobackend(updatedItems);
    }

    function handleAddRating(title) {
      const updatedItems = [...userRating, title];
      setUserRating(updatedItems);
      console.log("ratedBook: ", userRating);
    }

    function handleClickRemoveItems(title, author) {
      const updatedCartItems = cartItems.filter(
        (item) => item.title !== title || item.author !== author
      );
      setCartItems(updatedCartItems);
      sendItemsTobackend(updatedCartItems);
    }

    // for handling opening and closing of cart container
    function handletoggleCart() {
      setShowCart(!showCart);
    }

    // For handling book detail modal window
    function handleClickModalWindow(book) {
      let bookDetail = {};
      bookDetail = { ...book };

      setSelectedBook(bookDetail);
      fetchRecommendationBookDetailClicked(bookDetail);
    }

    // FOR SENDING DETAILs OF BOOK ON CLICKING BOOK DETAIL
    async function fetchRecommendationBookDetailClicked(book) {
      try {
        const response = await fetch("http://localhost:9000/bookDetail", {
          method: "POST",

          headers: { "Content-type": "application/json" },
          body: JSON.stringify(book),
        });

        const books = await response.json();
        console.log(books);
        setReceivedData(books.books);
      } catch (error) {
        console.log(error.message);
      }
    }

    //For closing book detail modal window
    function handleCloseBookDetail() {
      setSelectedBook("");
    }

    console.log("cartRecommendations", cartRecommendation);
    return (
      <div className="container">
        <Header
          query={query}
          setQuery={setQuery}
          cartItems={cartItems}
          OnClicktoggleCart={handletoggleCart}
          showCart={showCart}
          onClickRemoveItems={handleClickRemoveItems}
          handleSearch={handleSearch}
          handleSearchedBooks={handleSearchedBooks}
        ></Header>

        <BookContainer
          onClickModalWindow={handleClickModalWindow}
          bookData={bookData1}
          onClickAddToCart={handleClick}
        ></BookContainer>

        <CartRecommendationContainer cartRecommendation={cartRecommendation} />

        <SearchTop5Container SearchRecommendations={SearchRecommendations} />
        <SearchHistoryBasedRecommendContainer
          searchHistoryRecommendation={searchHistoryRecommendation}
        />
        {/* <button onClick={sendItemsTobackend}>Send Data To Backend</button> */}
        {selectedBook && (
          <BookDetails
            onClickRating={handleAddRating}
            selectedBook={selectedBook}
            onClickBookDetail={handleCloseBookDetail}
            receivedData={receivedData}
          />
        )}
      </div>
    );
  }
}

// export default function App() {
//   const [query, setQuery] = useState("");
//   const [bookData1, setBookData1] = useState([]);
//   const [cartCount, setCartCount] = useState(0);
//   const [cartItems, setCartItems] = useState([]);
//   const [showCart, setShowCart] = useState(false);
//   const [selectedBook, setSelectedBook] = useState("");
//   // const [error, setError] = useState("");

//   let volumeInfo;
//   let fetchedData = [];
//   let title;
//   let author = [];
//   let description;
//   let categories = [];
//   let image_link;

//   useEffect(() => {
//     async function fetchBooks() {
//       try {
//         //If no search is made then prevent fetching data
//         if (query.trim() === "") {
//           setBookData1([]);
//           return;
//         }
//         // q=subject:nonfiction&orderBy=newest

//         const response = await fetch(
//           `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40&key=${KEY}`
//         );

//         const data = await response.json();

//         // if (!data.items) {
//         //   throw new Error("book not found😢");
//         // }

//         const fetchedData = data.items
//           .map((element) => {
//             const { volumeInfo } = element;

//             // Assuming imageLinks is an object containing smallThumbnail property
//             const imageLink = volumeInfo.imageLinks
//               ? volumeInfo.imageLinks.thumbnail
//               : null;

//             // If any required property is missing, return null or undefined
//             if (
//               !volumeInfo.title ||
//               !volumeInfo.authors ||
//               !volumeInfo.description ||
//               !imageLink ||
//               !volumeInfo.categories
//             ) {
//               return null; // or return undefined;
//             }

//             // If all required properties exist, construct the new object and return it
//             return {
//               title: volumeInfo.title,
//               author: volumeInfo.authors,
//               description: volumeInfo.description,
//               image_link: imageLink,
//               categories: volumeInfo.categories,
//             };
//           })
//           .filter(Boolean);

//         setBookData1(fetchedData);
//       } catch (err) {
//         console.log(err);
//       }
//     }

//     fetchBooks();
//   }, [query]);

//   {
//     function handleClick(title, author, categories, image) {
//       setCartCount((cartCount) => cartCount + 1);
//       setCartItems([
//         ...cartItems,
//         { image, title, author, categories, quantity: cartCount },
//       ]);
//     }

//     function handleClickRemoveItems(title, author) {
//       const updatedCartItems = cartItems.filter(
//         (item) => item.title !== title && item.author !== author
//       );
//       setCartItems(updatedCartItems);
//     }

//     function handletoggleCart() {
//       setShowCart(!showCart);
//     }

//     function handleClickModalWindow(book) {
//       setSelectedBook(book);
//       console.log(selectedBook);
//     }

//     function handleCloseBookDetail() {
//       setSelectedBook("");
//     }

//     return (
//       <div className="container">
//         <Header
//           query={query}
//           setQuery={setQuery}
//           cartItems={cartItems}
//           OnClicktoggleCart={handletoggleCart}
//           showCart={showCart}
//           onClickRemoveItems={handleClickRemoveItems}
//         ></Header>

//         <BookContainer
//           onClickModalWindow={handleClickModalWindow}
//           bookData={bookData1}
//           onClickAddToCart={handleClick}
//         ></BookContainer>

//         {selectedBook && (
//           <BookDetails
//             selectedBook={selectedBook}
//             onClickBookDetail={handleCloseBookDetail}
//           />
//         )}
//       </div>
//     );
//   }
// }
//   function Header({
//     query,
//     setQuery,
//     OnClicktoggleCart,
//     showCart,
//     onClickRemoveItems,
//   }) {
//     return (
//       <div className="header">
//         <Logo></Logo>
//         <Search query={query} setQuery={setQuery}></Search>
//         <Cart
//           onClickRemoveItems={onClickRemoveItems}
//           cartItems={cartItems}
//           OnClicktoggleCart={OnClicktoggleCart}
//           showCart={showCart}
//         ></Cart>
//       </div>
//     );
//   }

//   function Logo() {
//     return (
//       <h1 className="logo">
//         📖<span className="logo-first-letter">R</span>ecommendo Reads
//       </h1>
//     );
//   }

//   function Search({ query, setQuery }) {
//     return (
//       <input
//         className="search"
//         type="text"
//         placeholder="Search books..."
//         value={query}
//         onChange={function (e) {
//           setQuery(e.target.value);
//         }}
//       />
//     );
//   }

//   // function ErrorMessage({ error }) {
//   //   return (
//   //     <div className="error-msg">
//   //       <p>
//   //         <span>⛔</span>
//   //         {error}
//   //       </p>
//   //     </div>
//   //   );
//   // }

//   function Cart({
//     cartItems,
//     OnClicktoggleCart,
//     showCart,
//     onClickRemoveItems,
//   }) {
//     return (
//       <div className="cart-div">
//         <button className="cart-logo" onClick={OnClicktoggleCart}>
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="42"
//             height="42"
//             fill="#fff"
//             viewBox="0 0 256 256"
//           >
//             <path d="M222.14,58.87A8,8,0,0,0,216,56H54.68L49.79,29.14A16,16,0,0,0,34.05,16H16a8,8,0,0,0,0,16h18L59.56,172.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,152,204a28,28,0,1,0,28-28H83.17a8,8,0,0,1-7.87-6.57L72.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,222.14,58.87ZM96,204a12,12,0,1,1-12-12A12,12,0,0,1,96,204Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,192,204Zm4-74.57A8,8,0,0,1,188.1,136H69.22L57.59,72H206.41Z"></path>
//           </svg>
//         </button>
//         <span className="cart-count">{cartItems.length}</span>
//         {showCart && (
//           <CartContainer
//             onClickRemoveItems={onClickRemoveItems}
//             cartItems={cartItems}
//           />
//         )}
//       </div>
//     );
//   }

//   function CartContainer({ cartItems, onClickRemoveItems }) {
//     return (
//       <div className="CartContainer">
//         <h2>You have {cartItems.length} items in your cart!</h2>
//         {cartItems.map((item, index) => (
//           <div key={index} className="cartItem">
//             <img src={item.image} alt={item.title} width="100" height="150" />
//             <div>
//               <h2>{item.title}</h2>
//               <p>{item.author}</p>
//               <span>{item.categories}</span>
//               <button
//                 onClick={() => onClickRemoveItems(item.title, item.author)}
//               >
//                 Remove Item
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   }

//   //  function DisplayBook() {
//   //   return (
//   //   {bookData.map((book) => (
//   //   <div className="book-item" key={book.title}>
//   //   <img
//   //     src={book.image_link}
//   //     alt={book.title}
//   //     width="190px"
//   //     height="250px"
//   //   />
//   //   <h2>{book.title}</h2>
//   //   <p>{book.author}</p>
//   //   <div className="rating-cartbutton-div">
//   //     <span>
//   //       <svg
//   //         xmlns="http://www.w3.org/2000/svg"
//   //         viewBox="0 0 256 256"
//   //         width="15"
//   //         height="15"
//   //       >
//   //         <rect width="256" height="256" fill="none" />
//   //         <path
//   //           d="M135.34,28.9l23.23,55.36a8,8,0,0,0,6.67,4.88l59.46,5.14a8,8,0,0,1,4.54,14.07L184.13,147.7a8.08,8.08,0,0,0-2.54,7.89l13.52,58.54a8,8,0,0,1-11.89,8.69l-51.1-31a7.93,7.93,0,0,0-8.24,0l-51.1,31a8,8,0,0,1-11.89-8.69l13.52-58.54a8.08,8.08,0,0,0-2.54-7.89L26.76,108.35A8,8,0,0,1,31.3,94.28l59.46-5.14a8,8,0,0,0,6.67-4.88L120.66,28.9A8,8,0,0,1,135.34,28.9Z"
//   //           fill="#f59f00"
//   //           stroke="#f59f00"
//   //           strokeLinecap="round"
//   //           strokeLinejoin="round"
//   //           strokeWidth="16"
//   //         />
//   //       </svg>
//   //       {book.rating}
//   //     </span>

//   //     <button className="add-to-cart">Add to cart</button>
//   //   </div>
//   // </div>
//   // )}

//   function BookContainer({ bookData, onClickAddToCart, onClickModalWindow }) {
//     return (
//       <div className="book-container">
//         {bookData.map((book, index) => (
//           <div className="book-item" key={index}>
//             <img
//               src={book.image_link}
//               alt={book.title}
//               width="190px"
//               height="250px"
//               onClick={() => onClickModalWindow(book)}
//             />

//             <h2>{book.title}</h2>
//             <p>{book.author.length > 0 ? book.author[0] : "Unknown Author"}</p>
//             <div className="rating-cartbutton-div">
//               <span>
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 256 256"
//                   width="15"
//                   height="15"
//                 >
//                   <rect width="256" height="256" fill="none" />
//                   <path
//                     d="M135.34,28.9l23.23,55.36a8,8,0,0,0,6.67,4.88l59.46,5.14a8,8,0,0,1,4.54,14.07L184.13,147.7a8.08,8.08,0,0,0-2.54,7.89l13.52,58.54a8,8,0,0,1-11.89,8.69l-51.1-31a7.93,7.93,0,0,0-8.24,0l-51.1,31a8,8,0,0,1-11.89-8.69l13.52-58.54a8.08,8.08,0,0,0-2.54-7.89L26.76,108.35A8,8,0,0,1,31.3,94.28l59.46-5.14a8,8,0,0,0,6.67-4.88L120.66,28.9A8,8,0,0,1,135.34,28.9Z"
//                     fill="#f59f00"
//                     stroke="#f59f00"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth="16"
//                   />
//                 </svg>
//                 {book.categories[0]}
//               </span>
//               <button
//                 className="add-to-cart"
//                 onClick={() =>
//                   onClickAddToCart(
//                     book.title,
//                     book.author,
//                     book.categories,
//                     book.image_link
//                   )
//                 }
//               >
//                 Add to cart
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   }
// }

// function BookDetails({ selectedBook }) {
//   return (
//     <div className="modal-overlay">
//       <div className="modal-window">
//         <div className="modal-content">
//           <div className="modal-content-img-div">
//             <img
//               src={selectedBook.image_link}
//               alt={selectedBook.title}
//               width="200"
//               height="300"
//             />
//           </div>
//           <div className="modal-content-second-div">
//             <h1>{selectedBook.title}</h1>
//             <h2>{selectedBook.author}</h2>
//             <span>summary</span>
//             <p>{selectedBook.description}</p>
//             <button>Close</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
