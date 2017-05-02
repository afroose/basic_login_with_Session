// user routes:
// home page /
// login page /login
// signup page /register 
// profile page 

const express = require('express');
const jsonParser = require('body-parser').json();
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('client-sessions');

const {Userid} = require('./userModels');

const router = express.Router();

router.use(jsonParser);

// set Sessions parameters

router.use(session({
  cookieName: 'session',
  secret: 'random_string_goes_here',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

// session Middleware

const checkUserCookie = (req, res, next) => {
  let user;
  if (req.session && req.session.user) { // if session exists
    Userid
        .findOne({ email: req.session.user.email }) // find user with email
        .exec()
        .then( _user => {
            user = _user;
            if (user) {
                req.user = user;
                delete req.user.password; // delete the password from the session
                req.session.user = user;  //refresh the session value
                res.locals.user = user;
            }
            // finishing processing the middleware and run the route
            next();
        });
    } else {
        next();
    }
}

const requireLogin = (req,res,next) => {
  if (!req.user) {
    res.redirect('/login');
  } else {
    next();
  }
};

router.use(checkUserCookie) 


// Users PAGE - sho all users - do not use in production

router.get('/users', (req,res) => {
    Userid
        .find()
        .exec()
        .then(users => {
          res.json(users);
        })
        .catch(
          err => {
            console.error(err);
            res.status(500).json({message: 'Internal server error'});
        });
})

// Index page - login or signup

router.get('/', (req,res) => {
    res.sendFile(path.join(__dirname,"../views/index.html"));
})

// Index page - local login

router.get('/login', (req,res) => {
    res.sendFile(path.join(__dirname,"../views/login.html"));
})
// Process login page

router.post('/login', (req, res) => { 
    let {email, user_password} = req.body;
    //console.log(email," ",user_password);
    let user;
    Userid
    .findOne({email: email}) // find user with email
    .exec()
    .then(_user =>{
        //console.log("test: ",_user.user_password)
        user = _user;
        //console.log("test for user: ",_user.user_password)
        if (!user) {
            console.log("no user");
            const message = `This user name does not exist`
            //console.error(message);
            return res.status(409).send(message);
        }
        else {
            console.log(user.user_password);
            console.log(req.body.user_password);
            bcrypt.compare(req.body.user_password,user.user_password).then((passwordCheck) => {
                console.log(passwordCheck);
                if (passwordCheck === false) {
                    const message = `Incorrect password`
                    return res.status(409).send(message);
                }
                else {
                    // sets a cookie with the user's info
                    req.session.user = user;
                    res.sendFile(path.join(__dirname,"../views/home.html"));
                }
            });
        }
        
    })
});

// Profile/home page - local signup

        // no middleware in place
        // router.get('/home', (req,res) => {
        //     console.log("I am home");
        //     let user;
        //     if (req.session && req.session.user) { // if session exists
        //         Userid
        //         .findOne({email: req.session.user.email}) // find user with email
        //         .exec()
        //         .then(_user => {
        //             user = _user;
        //             if(!user) { // no user in session
        //                 console.log("No user");
        //                 req.session.reset();
        //                 res.sendFile(path.join(__dirname,"../views/login.html"));
        //             } else { 
        //                 //console.log("User in session");
        //                 res.locals.user = user;
        //                 res.sendFile(path.join(__dirname,"../views/home.html"));
        //             }
        //         })
        //     } else {
        //         res.sendFile(path.join(__dirname,"../views/login.html"));
        //     }
        // })

// with middleware
router.get('/home', requireLogin, (req,res) => {
    res.sendFile(path.join(__dirname,"../views/home.html"));
})    

// Register page - local signup

router.get('/register', (req,res) => {
  res.sendFile(path.join(__dirname,"../views/register.html"));
})

router.post('/register', (req, res) => { 
  console.log(req.body.user_password) ;

    const requiredFields = ['email', 'user_password'];
    for (let i=0; i<requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
        const message = `Missing \`${field}\` in request body`
        console.error(message);
        return res.status(400).send(message);
        }
    }

//  Validation

    let {email, user_password, user_password2} = req.body;

    // req.checkBody('email', 'Email is required').notEmpty();
    // req.checkBody('email', 'Email is not valif').isEmail();
    // req.checkBody('password', 'Password is required').notEmpty();
    // req.checkBody('password2', 'Passwords do not match').equals(req.body.user_password);

    // let errors = req.validationErrors();

    // if (errors) {
    //     console.log('There are errors');
    //     res.render('/register', {
    //         error: errors
    //     });
    // } else {
    //     console.log('all good - no errors')
    // }

  Userid
    .find({email}) // find user with email
    .count() // count > 0 if exists
    .exec()
    .then(count =>{
        if (count > 0) { // if user exists - close
            console.log("already exist");
            res.status(409).json("This user name is already taken");
        }
        return Userid.hashPassword(user_password);
    })
    .then( // users does not exist - cstore user data in database

        newPassword => {
            console.log(newPassword);
            Userid 
                .create({
                email: email,
                user_password: newPassword
                })
                .then(
                    users => res.status(201).json(users)
                )
                .catch(err => {
                    console.error(err);
                    res.status(500).json({message: 'Internal server error'});
                })
            }
        )
});

module.exports = router;