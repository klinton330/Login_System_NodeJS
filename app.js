//Initiate All Dependency
const express = require('express')
const env = require('dotenv')
const path = require('path')
const hbs = require('hbs')
const cookieParser = require('cookie-parser')

//Route the request
const app = express()
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))

app.use('/', require('./router/pages'))
app.use('/auth', require('./router/auth'))
//Listen to port 5000
app.listen(5000, () => {
  console.log('server listening to port 5000')
})
//configure dotenv
env.config({
  path: './.env',
})
//Location to static files
const location = path.join(__dirname, './public')
app.use(express.static(location))
app.set('view engine', 'hbs')
//Register Partial Path with HBS
const partialPath = path.join(__dirname, './views/partial')
hbs.registerPartials(partialPath)
