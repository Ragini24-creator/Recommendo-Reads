import React from "react";
import Logo from "./Logo";
// import Search from "./Search";
import Cart from "./Cart";

export default function Header({
  query,
  setQuery,
  cartItems,
  OnClicktoggleCart,
  showCart,
  onClickRemoveItems,
  handleSearch,
  handleSearchedBooks,
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
      handleSearchedBooks();
    }
  };

  return (
    <div className="header">
      <Logo />
      <Search query={query} setQuery={setQuery} handleKeyDown={handleKeyDown} />
      <Cart
        onClickRemoveItems={onClickRemoveItems}
        cartItems={cartItems}
        OnClicktoggleCart={OnClicktoggleCart}
        showCart={showCart}
      />
    </div>
  );
}

function Search({ query, setQuery, handleKeyDown }) {
  return (
    <input
      className="search"
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Search for a book and press Enter"
    />
  );
}
