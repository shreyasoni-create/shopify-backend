const express= require("express");
const axios= require("axios");
require("dotenv").config();
const app = express();
app.use(express.json())
app.get("/" , (req , res)=>{
    res.send("hello this is my first backend ");

});
app.post("/webhook/order-created", async (req, res) => {
    const orderId = req.body.order_id;
    const customername= req.body.customer.name;
   

  console.log(orderId);

console.log(customername);

for (let i = 0; i < req.body.products.length; i++) {

    console.log(req.body.products[i].title);

const productTitle = req.body.products[i].title;

  if (productTitle === "Face Wash") {
        console.log("Send to Warehouse A");
    } else {
        console.log("Send to Warehouse B");
    }
}
const response = await axios.get("https://jsonplaceholder.typicode.com/users/1");

console.log(response.data);
console.log(process.env.MY_NAME);

    res.send("Shopify Order Received");

});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

