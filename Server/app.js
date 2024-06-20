const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
// const natural = require("natural");
const bodyParser = require("body-parser");

const app = express();

dotenv.config({ path: "./config.env" });
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log(con.connections);
    console.log("DB connection successful!");
  });

app.use(bodyParser.json());

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://recommendo-reads.vercel.app"]
    : ["http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
  })
);
// app.use(
//   cors({
//     origin: "http://localhost:3000",
//   })
// );

app.get("/", async function (req, res) {
  try {
    const responseData = await Book.find({});
    res.status(200).json({ docs: responseData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const searchHistorySchema = new mongoose.Schema({
  keywords: [String],
  timeStamp: {
    type: Date,
    default: Date.now,
  },
});

const SearchHistory = mongoose.model("SearchHistory", searchHistorySchema);

// /// API  ENDPOINT FOR HANDLING SEARCHED BOOKS

app.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.term;

    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required" });
    }

    const foundBook = await Book.findOne({ title: searchTerm });

    if (foundBook) {
      console.log("Found Book: ", foundBook);
      return res.status(200).json(foundBook);
    } else {
      return res.status(404).json({ error: "Book not found" });
    }
  } catch (error) {
    console.error("Error searching for book:", error);
    return res.status(500).json({ error: error.message });
  }
});

//////////// Endpoint to capture search history and provide recommendation based on it.
app.post("/search", async (req, res) => {
  const { keywords } = req.body;

  try {
    // Store search history entry in MongoDB
    await SearchHistory.create({ keywords: keywords });
    // Fetch recommendations based on the search history
    const recommendations = await SearchBasedRecommendations();
    const booksBasedonSearchHistory =
      await recommendBooksBasedOnSearchHistory();

    console.log("SearchBasedRecommendations: ", booksBasedonSearchHistory);
    // Return search history confirmation and recommendations to the client
    res.status(200).json({
      message: "Search history captured successfully",
      recommendations,
      booksBasedonSearchHistory,
    });
  } catch (error) {
    console.error("Error capturing search history:", error);
    res.status(500).send("Internal server error");
  }
});

async function recommendBooksBasedOnSearchHistory() {
  try {
    // Retrieve the search history from the database, sorted by timestamps in descending order
    const searchHistory = await SearchHistory.find()
      .sort({ timeStamp: -1 }) // Sort by timeStamp in descending order
      .limit(5) // Limit to the most recent 5 search history entries
      .exec();

    // Extract keywords (book titles) from the most recent search history entries
    const recentKeywords = searchHistory.flatMap((entry) => entry.keywords);

    // Array to store genres of recently searched books
    let recentGenres = [];

    // Iterate through recentKeywords to find genres of corresponding books
    for (let keyword of recentKeywords) {
      // Find the book with the current keyword/title
      const book = await Book.findOne({ title: keyword }).exec();
      if (book) {
        // If book found, add its genre(s) to recentGenres
        recentGenres = recentGenres.concat(book.genre);
      }
    }

    // Search for books in the database that have genres similar to the recent search genres
    const recommendedBooks = await Book.find({
      genre: { $in: recentGenres },
      title: { $nin: recentKeywords }, // Exclude the recently searched books
    }).exec();

    // Shuffle the recommended books to provide a randomized order
    const shuffledBooks = recommendedBooks.sort(() => Math.random() - 0.5);

    // Return the shuffled list of books as recommendations
    return shuffledBooks;
  } catch (error) {
    console.error("Error recommending books based on search history:", error);
    throw error;
  }
}

async function SearchBasedRecommendations() {
  try {
    let recommendations = [];

    // Fetch the top 5 most searched keywords from the search history
    const searchHistory = await SearchHistory.aggregate([
      { $unwind: "$keywords" },
      { $group: { _id: "$keywords", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }, // Limit to top 5 most searched keywords
    ]);

    // Extract the top 5 keywords
    const topKeywords = searchHistory.map((keyword) => keyword._id);

    // Search for books in the Book collection based on the top keywords
    recommendations = await Book.find({
      $or: [{ title: { $in: topKeywords } }, { author: { $in: topKeywords } }],
    })
      .limit(5) // Limit to top 5 books
      .exec();

    console.log("Search recommendation", recommendations);

    return recommendations;
  } catch (error) {
    console.error("Error fetching search recommendations:", error);
    throw error;
  }
}

const CartItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  categories: { type: [String], required: true },
  rating: { type: Number, required: true },
  image: { type: String },
});
const CartItem = mongoose.model("CartItem", CartItemSchema);

/////////////API ENDPOINT FOR PROVIDING RECOMMENDTION BASED ON CART ITEMS

app.post("/", async function (req, res) {
  let data = [];
  data = [...data, ...req.body];
  removeBooksFromDatabase(req.body);

  // Add new books to the database if they don't already exist
  await addOrUpdateBooksToDatabase(req.body);
  const bookRecommended = await bookRecommendation(req.body);

  res
    .status(200)
    .json({ message: "success", bookRecommended: bookRecommended });
});

async function removeBooksFromDatabase(cartItems) {
  try {
    // Get the titles of items currently in the cart
    const cartItemTitles = cartItems.map((item) => item.title);

    // Find and remove books from the database that are not in the current cart
    await CartItem.deleteMany({ title: { $nin: cartItemTitles } });
  } catch (error) {
    console.error("Error removing books from database:", error);
    throw error;
  }
}

// Function to add or update books in the database
async function addOrUpdateBooksToDatabase(cartItems) {
  try {
    // Iterate over each item in the cart
    for (const item of cartItems) {
      // Check if the book already exists in the database
      const existingCartItem = await CartItem.findOne({ title: item.title });

      // If the book doesn't exist, add it to the database
      if (!existingCartItem) {
        const newCartItem = new CartItem({
          title: item.title,
          author: item.author,
          categories: item.categories,
          rating: item.rating,
          image: item.image,
        });
        await newCartItem.save();
      }
    }
  } catch (error) {
    console.error("Error adding/updating books to database:", error);
    throw error;
  }
}

async function bookRecommendation(books) {
  try {
    // Extract the titles of books in the user's cart
    const cartBookTitles = books.map((book) => book._id);

    // Extract the first few genres from the array of books received from the frontend
    const prioritizedGenres = books.reduce((acc, curr) => {
      acc.push(curr.categories.slice(0, 2)); // Take only the first 2 genres
      return acc;
    }, []);

    // Flatten the array of prioritized genres
    const flattenedGenres = prioritizedGenres.flat();

    // Calculate the average rating of books in the user's cart
    const averageRating =
      books.reduce((total, curr) => total + curr.rating, 0) / books.length;

    // Query the database for all books (including the newly added ones)
    const allBooks = await Book.find().exec();

    // Filter out the books that are in the user's cart
    const availableBooks = allBooks.filter(
      (book) => !cartBookTitles.includes(book._id)
    );

    // Perform the recommendation algorithm on the available books
    const recommendedBooks = availableBooks
      .filter(
        (book) =>
          book.genre.some((genre) => flattenedGenres.includes(genre)) &&
          book.rating >= averageRating - 0.5 &&
          book.rating <= averageRating + 0.5
      )
      .slice(0, 10); // Limit to 10 recommended books

    // If no books are found for the prioritized genres and ratings, try other genres
    if (recommendedBooks.length === 0) {
      const remainingGenres = books.reduce((acc, curr) => {
        acc.push(...curr.categories.slice(2)); // Skip the first 2 genres
        return acc;
      }, []);

      const otherGenreBooks = availableBooks
        .filter(
          (book) =>
            book.genre.some((genre) => remainingGenres.includes(genre)) &&
            book.rating >= averageRating - 0.5 &&
            book.rating <= averageRating + 0.5
        )
        .slice(0, 4); // Limit to 4 recommended books

      return otherGenreBooks;
    }

    // Randomize the order of recommended books
    const randomizedBooks = recommendedBooks.sort(() => Math.random() - 0.5);
    return randomizedBooks;
    // return recommendedBooks;
  } catch (error) {
    console.error("Error fetching recommended books:", error);
    throw error;
  }
}

// API ENDPOINT FOR SHoWING BOOK RECOMMENDATION BASED ON SINGLE BOOK

app.post("/bookDetail", async function (req, res) {
  try {
    const bookDetail = req.body;
    console.log("BooKDetail: ", bookDetail);
    const books = await bookRecommendationBasedOnSingleBook(
      bookDetail.categories,
      bookDetail.title
    );
    console.log("books", books);
    res.status(200).json({ message: "success", books: books });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

async function bookRecommendationBasedOnSingleBook(bookGenres, bookTitle) {
  try {
    // Take the first two genres from the provided array
    const primaryGenres = bookGenres.slice(0, 2);

    // Search for books in the database based on the primary genres
    let recommendedBooks = await Book.find({
      genre: { $in: primaryGenres },
      title: { $ne: bookTitle }, // Exclude books with the same title
    })
      .limit(6) // Limit to 6 recommended books
      .exec();

    // If there are books available for both primary genres
    if (recommendedBooks.length >= 3 && recommendedBooks.length <= 6) {
      // Extract books for each primary genre
      const primaryGenreBooks = {
        [primaryGenres[0]]: [],
        [primaryGenres[1]]: [],
      };

      recommendedBooks.forEach((book) => {
        if (
          book.genre === primaryGenres[0] &&
          primaryGenreBooks[primaryGenres[0]].length < 3
        ) {
          primaryGenreBooks[primaryGenres[0]].push(book);
        } else if (
          book.genre === primaryGenres[1] &&
          primaryGenreBooks[primaryGenres[1]].length < 3
        ) {
          primaryGenreBooks[primaryGenres[1]].push(book);
        }
      });

      // If not enough books are found for any primary genre
      if (
        primaryGenreBooks[primaryGenres[0]].length < 3 ||
        primaryGenreBooks[primaryGenres[1]].length < 3
      ) {
        const remainingGenres = bookGenres.slice(2); // Exclude the primary genres

        // Search for additional books based on the remaining genres
        const additionalBooks = await Book.find({
          genre: { $in: remainingGenres },
          title: { $ne: bookTitle }, // Exclude books with the same title
        })
          .limit(6 - recommendedBooks.length) // Limit to fill the remaining slots
          .exec();

        // Combine the results with the previously found books
        recommendedBooks = recommendedBooks.concat(additionalBooks);
      } else {
        // Merge books from primary genres
        recommendedBooks = primaryGenreBooks[primaryGenres[0]].concat(
          primaryGenreBooks[primaryGenres[1]]
        );
      }
    } else {
      // If there are no books found for both primary genres
      const remainingGenres = bookGenres.slice(2); // Exclude the primary genres

      // Search for books based on remaining genres
      recommendedBooks = await Book.find({
        genre: { $in: remainingGenres },
        title: { $ne: bookTitle }, // Exclude books with the same title
      })
        .limit(6) // Limit to 6 recommended books
        .exec();
    }

    return recommendedBooks;
  } catch (error) {
    console.error("Error fetching recommended books by genre:", error);
    throw error;
  }
}

port = 9000;
app.listen(port, () => {
  console.log("Hello !");
});

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },

  author: {
    type: String,
    required: true,
  },

  imageLink: {
    type: String,
    required: true,
  },

  genre: {
    type: [String],
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  rating: {
    type: Number,
    required: true,
  },
});

const Book = mongoose.model("Book", bookSchema);

// newBook = [

// ];
// const newBook = new Book();

// Book.insertMany(newBook)
//   .then((res) => console.log(res))
//   .catch((error) => console.log(error));

// // Function to recommend books based on user's interests
// async function recommendBooks(userData) {
//   try {
//     // Fetch all books from the database
//     const booksData = await Book.find({});

//     // Define recommendations array
//     const recommendations = [];

//     // Iterate over each book's genre
//     booksData.forEach((book) => {
//       // Iterate over each genre
//       book.genre.forEach((genre) => {
//         // Find other books with the same genre (excluding the current book)
//         const similarBooks = booksData.filter(
//           (otherBook) =>
//             otherBook.title !== book.title && otherBook.genre.includes(genre)
//         );

//         // Add similar books to recommendations
//         recommendations.push(...similarBooks);
//       });
//     });

//     // Remove duplicates from recommendations
//     const uniqueRecommendations = Array.from(
//       new Set(recommendations.map((book) => book.title))
//     ).map((title) => recommendations.find((book) => book.title === title));

//     return uniqueRecommendations;
//   } catch (error) {
//     console.error("Error:", error);
//     throw error;
//   }
// }
