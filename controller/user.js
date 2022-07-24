const mysql = require('mysql')
const env = require('dotenv')
const bycrpt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const e = require('express')
const { promisify } = require('util')

//configure dotenv
env.config({
  path: './.env',
})
//configure mySql
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
})

db.connect((err) => {
  if (err) {
    console.log(err)
  } else console.log('connected')
})

exports.register = (req, res) => {
  console.log(req.body)
  const { name, email, password, confirm_password } = req.body
  db.query(
    'select * from register_table where email=?',
    [email],
    async (error, result) => {
      if (error) {
        return res.render('register', {
          msg: 'some internal error',
          msg_type: 'error',
        })
      } else if (result.length > 0) {
        console.log(result)
        return res.render('register', {
          msg: 'Email is already Registered',
          msg_type: 'error',
        })
      } else if (password !== confirm_password) {
        return res.render('register', {
          msg: 'password do not match',
          msg_type: 'error',
        })
      }
      const hashPassword = await bycrpt.hash(password, 8)
      console.log(hashPassword)
      db.query(
        'insert into register_table set ?',
        { person_name: name, email: email, pass: hashPassword },
        (error, result) => {
          if (error) console.log(error)
          else {
            console.log(result)
            return res.render('register', {
              msg: 'User registration success',
              msg_type: 'success',
            })
          }
        },
      )
    },
  )
}

exports.login = (req, res) => {
  try {
    console.log('inside login')
    const { email, password } = req.body
    console.log(email, password)
    if (!email || !password)
      return res.status(400).render('login', {
        msg: 'Should enter email and password',
        msg_type: 'error',
      })

    db.query(
      'select*from register_table where email=?',
      [email],
      async (error, result) => {
        if (error) console.log(error)
        else if (result.length <= 0)
          return res.status(401).render('login', {
            msg: 'No matching email found',
            msg_type: 'error',
          })
        else if (
          result.length > 0 &&
          !(await bycrpt.compare(password, result[0].pass))
        ) {
          return res.status(401).render('login', {
            msg: 'Password is incorrect',
            msg_type: 'error',
          })
        } else {
          // res.render('home')
          const id = result[0].id
          const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
          })

          const cookieOption = {
            expires: new Date(
              Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000,
            ),
            httpOnly: true,
          }
          res.cookie('klin', token, cookieOption)
          res.status(200).redirect('/home')
          console.log(token)
        }

        console.log(result)
      },
    )
    console.log(email, password)
  } catch (error) {
    console.log(error)
  }
}

exports.isLoggedIn = async (req, res, next) => {
  // console.log(req.cookies.klin)
  //If available on cookie
  if (req.cookies.klin) {
    const decode = await promisify(jwt.verify)(
      req.cookies.klin,
      process.env.JWT_SECRET,
    )
    console.log(decode)
    db.query(
      'select * from register_table where id=?',
      [decode.id],
      (error, result) => {
        console.log(result)
        if (error) return next()
        else if (!result) return next()
        req.user = result[0]
        return next()
      },
    )
  } else next()
}

exports.logout = (req, res) => {
  console.log('logout called')
  res.cookie('klin', 'logout', {
    expires: new Date(Date.now() + 2000),
    httpOnly: true,
  })

  res.status(200).redirect('/')
}
