import React from "react";

function CartContainer({ cartItems, onClickRemoveItems }) {
  return (
    <div className="CartContainer">
      <h2>You have {cartItems.length} items in your cart!</h2>
      {cartItems.map((item, index) => (
        <div key={index} className="cartItem">
          <img src={item.image} alt={item.title} width="100" height="150" />
          <div>
            <h2>{item.title}</h2>
            <p>{item.author}</p>
            <span>{item.rating}</span>
            <span>
              {item.categories[0] && item.categories[1] && item.categories[3]}
            </span>
            <button onClick={() => onClickRemoveItems(item.title, item.author)}>
              Remove Item
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CartContainer;
