const express = require('express')
const dotenv = require('dotenv');
const connectDB = require('./config/db')
const cors = require('cors')
const app = express()

// app.use(cors)

dotenv.config()
connectDB() // Added parentheses to call the function

app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use('/api/users', require('./routes/userRoutes'));  
app.use('/api/products', require('./routes/productRoutes'))



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));