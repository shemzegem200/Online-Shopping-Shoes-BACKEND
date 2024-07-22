const express = require('express')
const mongoose=require('mongoose');
const Product = require('./models/product.model.js');
const Customer = require('./models/customer.model.js');
const Order = require('./models/order.model.js');
const Fuse = require('fuse.js');
const bcrypt = require('bcrypt');
const cors = require("cors");
const jwt = require("jsonwebtoken");
const CookieParser = require('cookie-parser');
//needed to send email
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

//secret string for hashing the web token
const secret = "sadv12c1w4cjnqgvui3b4v19px";

//middleware
const app = express();
app.use(express.json());
app.use(cors({credentials:true, origin:'http://localhost:3000' }));
app.use(CookieParser());


//connect
app.listen(4000,()=>{
    console.log("Server running on port 4000");
});


//testing
app.get('/test', (req, res)=>{
    res.status(200).json({result: true});
});


//endpoint to check if the user is logged in
app.get("/api/profile", (req, res) => {
    //res.json(req.cookies);
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) throw err;
        res.json(info);
    });
});
//endpoint to logout
app.post("/api/logout", (req, res) => {
    res.cookie('token', '').json('ok');
});


//____________________________________________________________________________________________________SHOES CRUD
//get all shoes for index page
app.get('/api/products',async(req,res)=>{
    const arrOfPrdts = await Product.find({});
    res.status(200).json(arrOfPrdts);
});


//get shoe based on id
app.get('/api/product/:id',async(req,res)=>{
    const {id} =req.params;

    const array=await Product.findById(id);
    res.status(200).json(array);
});


//add shoe to table
app.post('/api/products',async(req,res)=>{
    try{
        const product=await Product.create(req.body);
        res.status(200).json(product);
    }
    catch(error){
            res.status(500).json({message:error.message});
    }
});

//update product
app.put("/api/product/:id",async(req,res)=>{
    try{
        const {id}=req.params;
        const arr=await Product.findByIdAndUpdate(id,req.body);
        
        if(!arr){
            return res.status(404).json({message:"Product not Found"});
        }
        const updat=await Product.findById(id);
        res.status(200).json(updat);
    }
    catch(error){
        res.status(500).json({message:error.message});
    }
});

//delete a product
app.delete("/api/product/:id",async(req,res)=>{
    try{
        const {id}=req.params;
        const arr=await Product.findByIdAndDelete(id);
        res.status(200).json(arr);
    }
    catch(error){
        res.status(500).json({message:error.message})
    }
});

//search for product
app.get('/api/products/search/:input', async (req, res) => {
    const { input } = req.params;

    try {
        // Retrieve all products
        const products = await Product.find();

        // Setup Fuse.js for fuzzy search
        const options = {
            includeScore: true,
            keys: ['name']
        };
        const fuse = new Fuse(products, options);

        // Perform the search
        const result = fuse.search(input);

        // Extract the actual product data from the result
        const matchedProducts = result.map(res => res.item);

        res.status(200).json(matchedProducts);
    } catch (error) {
        console.error('Error searching for products:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


//____________________________________________________________________________________________________CUSTOMERS CRUD

//getting all customers
app.get("/api/customers", async(req, res)=>{
    try{
        const arr=await Customer.find({});
        res.status(200).json(arr);
    }
    catch(error){
            res.status(500).json({message:error.message});
    }
});

app.get("/api/orders", async(req, res)=>{
    try{
        const arr=await Order.find({});
        res.status(200).json(arr);
    }
    catch(error){
            res.status(500).json({message:error.message});
    }
});


//adding a customer
app.post('/api/customers',async(req,res)=>{
    try{
        req.body.phone = parseInt(req.body.phone);
        const cust=await Customer.create(req.body);
        res.status(200).json(cust);
    }
    catch(error){
            res.status(500).json({message:error.message});
    }
});


//validate login
app.post('/api/customer/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email, password);

        // Validate email and password fields
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Find the customer by email
        const customer = await Customer.findOne({ email: email });
        if (!customer) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Return true if credentials are valid
        res.status(200).json(customer);
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


//get favorites given an input array of id's
app.post("/api/customer/getfavorites", async (req, res) => {
    try {
        const arr = req.body;
        
        // Use Promise.all to handle multiple asynchronous operations concurrently
        const favShoes = await Promise.all(arr.map(id => Product.findById(id)));

        res.status(200).json(favShoes);
    } catch (error) {
        console.error('Error during fetching favorites:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

//get cart items given an input array of id's
app.post("/api/customer/getcart", async (req, res) => {
    try {
        const arr = req.body;
        
        // Use Promise.all to handle multiple asynchronous operations concurrently
        const CartShoes = await Promise.all(arr.map(id => Product.findById(id)));

        res.status(200).json(CartShoes);
    } catch (error) {
        console.error('Error during fetching favorites:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

//update a customer
app.post("/api/particularcustomer", async (req, res) => {
    try {
        // Parse phone number if present
        if (req.body.phone) {
            req.body.phone = parseInt(req.body.phone);
        }

        // Extract fields to update, excluding password
        const { name, phone, email, favorites, cart, selectedSize } = req.body;

        // Use $set operator to update only specified fields
        const updateFields = {
            ...(name !== undefined && { name }),
            ...(phone !== undefined && { phone }),
            ...(email !== undefined && { email }),
            ...(favorites !== undefined && { favorites }),
            ...(cart !== undefined && { cart }),
            ...(selectedSize !== undefined && { selectedSize })
        };

        // Ensure that at least one field is provided for update
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: "No fields provided for update" });
        }

        // Find and update the customer
        const updatedCustomer = await Customer.findOneAndUpdate(
            {email},
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedCustomer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        res.status(200).json(updatedCustomer);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: error.message });
    }
});


//api call to place an order
app.post("/api/placeorder", async(req, res)=>{
    try{
        const response = await Order.create(req.body);
        res.status(200).json(response);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: error.message });
    }
});



//api call to send email to client for confirming order
// app.post('/api/send-email', (req, res) => {
//     const { email, subject, message } = req.body;
  
//     const transporter = nodemailer.createTransport({
//       service: 'Gmail',
//       auth: {
//         user: 'shyamvaradharajan200@gmail.com',
//         pass: 'Gops123!',
//       },
//     });
  
//     const mailOptions = {
//       from: 'shyamvaradharajan200@gmail.com',
//       to: email,
//       subject: subject,
//       text: message,
//     };
  
//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         return res.status(500).send(error.toString());
//       }
//       res.status(200).send({result: 'Email sent: ' + info.response});
//     });
// });



//connect to database
mongoose.connect("mongodb+srv://sachinrangabaskar344:abcd@backend.4d6ywoo.mongodb.net/?retryWrites=true&w=majority&appName=backend")
  .then(() => console.log('Connected!'))
.catch(()=>{
    console.log("Connection Failed");
});