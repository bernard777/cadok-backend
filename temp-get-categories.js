require('dotenv').config({path:'.env.test'}); 
const mongoose = require('mongoose'); 
const Category = require('./models/Category'); 

mongoose.connect(process.env.MONGODB_URI||'mongodb://localhost:27017/cadok_test')
.then(async()=>{
  const cats = await Category.find().limit(10).select('_id name'); 
  console.log('📂 Catégories disponibles:'); 
  cats.forEach(c=>console.log(`   ${c._id}: ${c.name}`)); 
  process.exit(0);
});
