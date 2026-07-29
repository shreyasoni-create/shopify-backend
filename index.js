const express= require("express");
const axios= require("axios");
require("dotenv").config();
const app = express();
app.use(express.json())
app.get("/" , (req , res)=>{
    res.send("hello this is my first backend ");

});

app.post("/webhook/order-created", async (req, res) => {

  console.log("========== WEBHOOK RECEIVED ==========");
  console.log("Time:", new Date().toISOString());

  console.log(JSON.stringify(req.body, null, 2));

  res.status(200).send("OK");

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

