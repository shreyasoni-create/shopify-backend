const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: Number,
  customerName: String,
  email: String,
  totalPrice: Number
});

module.exports = mongoose.model("Order", orderSchema);