// import dependencies you will use
const express = require("express");
const path = require("path");
//const bodyParser = require('body-parser'); // not required for Express 4.16 onwards as bodyParser is now included with Express
// set up expess validator
const { check, validationResult } = require("express-validator"); //destructuring an object
// const fileupload = require('express-fileupload');

// For adding login/logout
const session = require("express-session");
// install mongoose
// fetch mongoose into the project
const mongoose = require("mongoose");

// set up variables to use packages
var myApp = express();
mongoose.set('strictQuery', true);

// 3. connect to DB
// mongoose.connect('mongodb+srv://rao_pr3m:DZQqBzyMDh4C1tOj@dma.bmolect.mongodb.net/DMA');   // localhost could also be called 127.0.0.1 in case it doesnot work 127.0.0.1:27017/mydatabase
mongoose.connect("mongodb://localhost:27017/Daly-Music-Academy"); // localhost could also be called 127.0.0.1 in case it doesnot work 127.0.0.1:27017/mydatabase

// myApp.use(bodyParser.urlencoded({extended:false})); // old way before Express 4.16
myApp.use(express.urlencoded({ extended: false })); // new way after Express 4.16
// Bodyparser does not handles files.. we will user npm file upload (npm i express-fileupload)
//myApp.use(fileupload());

// set path to public folders and view folders

myApp.set("views", path.join(__dirname, "views"));

//use public folder for CSS etc.

myApp.use(express.static(__dirname + "/public"));
myApp.set("view engine", "ejs");

// Define model for storing user created tickets to DB
const RegisteredUser = mongoose.model("RegisteredUser", {
  userRegistrationNumber: String,
  userName: String,
  userAddress: String,
  userEmail: String,
  userPhone: Number,
  userAge: Number,
  userPlayingLevel: String,
  userExperienceInYears: Number,
  userInstrument: String,
  userStatus: String,
  userPaymentStatus: String,
  userIsLoginCreated: Boolean,
});

// Define model for storing user created tickets to DB
const EnrolledUser = mongoose.model("EnrolledUser", {
  userRegistrationNumber: String,
  userName: String,
  userInstrument: String,
  userLoginName: String,
  userPassword: String,
  userStatus: String,
  userPaymentStatus: String,
  userIsLoginCreated: Boolean,
});

// create a model for admin users
const AdminUser = mongoose.model("AdminUser", {
  username: String,
  password: String,
});

// create a model for Class Notes page
const Notes = mongoose.model("Notes", {
  filename: String,
  subcategory: String,
  category: String,
  instrument: String,
});

//setup body parser ( to fetch the response)
myApp.use(express.urlencoded({ extended: false }));

myApp.use(
  session({
    secret: "iwishitwas16decalready1282022", // should be unique for each application
    resave: false,
    saveUninitialized: true,
  })
);

let globalInstrument;

// set up different routes (pages) of the website
// render the home page
myApp.get("/", function (req, res) {
  var pageData = {
    sessionLoggedIn: req.session.loggedIn,
    userInstrument: globalInstrument,
  };
  res.render("homepage", pageData); // will render views/home.ejs
});

//login route
myApp.get("/login", function (req, res) {
  res.render("login");
});

//logout route
myApp.get("/logout", function (req, res) {
  req.session.username = ""; // reset the username
  req.session.loggedIn = false; // make logged in false from true
  res.redirect("/login");
});

//Student Logout
//logout route
myApp.get("/studentLogout", function (req, res) {
  req.session.username = ""; // reset the username
  req.session.loggedIn = false; // make logged in false from true
  res.redirect("/login");
});

// login process page
myApp.post("/loginProcess", function (req, res) {
  // fetch user input for uname pwd
  var username = req.body.username;
  var password = req.body.password;

  // find entry in database based on the username and password
  AdminUser.findOne({ username: username, password: password }).exec(function (
    err,
    adminUser
  ) {
    // adminUser would be true if there is entry matching the user entered values in DB
    if (adminUser) {
      // save in session
      req.session.username = adminUser.username;
      req.session.loggedIn = true;
      // redirect admin to dashboard if found
      res.redirect("/adminDashboard");
    } else {
      EnrolledUser.findOne({
        userLoginName: username,
        userPassword: password,
      }).exec(function (err, enrolledUser) {
        if (enrolledUser) {
          // save in session
          req.session.username = enrolledUser.userLoginName;
          req.session.loggedIn = true;
          // redirect admin to dashboard if found
          var redirectUrl = "/classNotes/" + enrolledUser.userInstrument;
          globalInstrument = enrolledUser.userInstrument;
          res.redirect(redirectUrl);
        } else {
          EnrolledUser.findOne({
            userLoginName: username,
            userPassword: password,
          }).exec(function (err, enrolledUser) {
            if (enrolledUser) {
              // save in session
              req.session.username = enrolledUser.userLoginName;
              req.session.loggedIn = true;
              // redirect admin to dashboard if found
              var redirectUrl =
                "/classNotes/" + enrolledUser.userInstrument.toLowerCase();
              res.redirect(redirectUrl);
            } else {
              // send an error message to user view if incorrect username password are entered
              var pageData = {
                error: "Unauthorised Access! Try Again",
              };
              // stay on login page only
              res.render("login", pageData);
            }
          });
        }
      });
    }
  });
});

// Setup to create a user entry for the admin user for the first time.
// This setup needs to be run manually for this project only, not for actual real time implementation

myApp.get("/setup", function (req, res) {
  res.render("setup");
});

myApp.post("/setupProcess", function (req, res) {
  var username = req.body.username;
  var password = req.body.password;

  var adminData = {
    username: username,
    password: password,
  };

  // Create an instance of the admin model, pass the data to be saved and save the entry.
  var newAdmin = new AdminUser(adminData);
  newAdmin.save();
  var responseData = {
    resMessage: "Your request has been successfully submitted",
  };

  // send the data to the view and render it
  res.render("messagePage", responseData);
});

//submit process to take user inputs for bug ticket and save the record to DB
myApp.post(
  "/submitRegistration",
  [
    //check('userName', 'Please enter your name!').notEmpty(),
    // …
    check("userName")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Name empty, Please enter your name!"),

    // …

    check("email", "Please Enter your email in a correct format!").isEmail(),
    check(
      "phone",
      "Please Enter your phone number in correct format!"
    ).isMobilePhone(),
    //check('userAddress', 'Please enter your address').isEmpty(),
    check("age", "Please enter age in numbers only!").isNumeric(),
    check(
      "yearsOfPlayingExperience",
      "Please enter years of experienc in numbers only!"
    ).isNumeric(),
  ],
  function (req, res) {
    // fetching the user inputs
    console.log("Request Body");
    console.log(req.body);
    const todaysDate = new Date(Date.now());
    const currentMonth = todaysDate.getMonth() + 1; // bcz month starts from 0 hence, +1 will return current month, without +1, it will return prev mnonth.
    var userRegistrationNumber =
      todaysDate.getDate() +
      "" +
      currentMonth +
      "" +
      todaysDate.getMilliseconds(); //Math.floor(Math.random()) +
    console.log("reg number:" + userRegistrationNumber);
    var userName = req.body.userName;
    var userAddress = req.body.address;
    var userEmail = req.body.email;
    var userPhone = req.body.phone;
    var userAge = req.body.age;
    var userPlayingLevel = req.body.playingLevel;
    var userExperienceInYears = req.body.yearsOfPlayingExperience;
    var userInstrument = req.body.instrument;
    var userIsLoginCreated = false;
    var userPaymentStatus = "Pending";
    var userStatus = "Inactive";

    //using validation method of express-validator
    const errors = validationResult(req);

    //checking if there are errors
    if (!errors.isEmpty()) {
      //if there are errors
      var errorData = errors.array();

      //send user data to view for preserving it
      var userData = {
        userName: userName,
        userEmail: userEmail,
        userPhone: userPhone,
        userAge: userAge,
        userExperienceInYears: userExperienceInYears,
      };

      var pageData = {
        errors: errorData,
        userData: userData,
      };

      res.render("register", pageData);
    } else {
      // create an object with the fetched data to send to the view
      var pageData = {
        userRegistrationNumber: userRegistrationNumber,
        userName: userName,
        userAddress: userAddress,
        userEmail: userEmail,
        userPhone: userPhone,
        userAge: userAge,
        userPlayingLevel: userPlayingLevel,
        userExperienceInYears: userExperienceInYears,
        userInstrument: userInstrument,
        userIsLoginCreated: userIsLoginCreated,
        userPaymentStatus: userPaymentStatus,
        userStatus: userStatus,
      };

      // Create an instance of the userTicket model, pass the data to be saved and save the entry.
      var newUserRegistration = new RegisteredUser(pageData);
      newUserRegistration.save();

      var responseData = {
        resMessage: "Your request has been successfully submitted",
      };

      // send the data to the view and render it
      res.render("messagePage", responseData);
    }
  }
);

myApp.post(
  "/submitAdminRegistration",
  [
    //check('userName', 'Please enter your name!').notEmpty(),
    // …
    check("userName")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Name empty, Please enter your name!"),

    // …

    check("email", "Please Enter your email in a correct format!").isEmail(),
    check(
      "phone",
      "Please Enter your phone number in correct format!"
    ).isMobilePhone(),
    //check('userAddress', 'Please enter your address').isEmpty(),
    check("age", "Please enter age in numbers only!").isNumeric(),
    check(
      "yearsOfPlayingExperience",
      "Please enter years of experience in numbers only!"
    ).isNumeric(),
  ],
  function (req, res) {
    // fetching the user inputs
    console.log("Request Body");
    console.log(req.body);
    const todaysDate = new Date(Date.now());
    const currentMonth = todaysDate.getMonth() + 1; // bcz month starts from 0 hence, +1 will return current month, without +1, it will return prev mnonth.
    var userRegistrationNumber =
      todaysDate.getDate() +
      "" +
      currentMonth +
      "" +
      todaysDate.getMilliseconds(); //Math.floor(Math.random()) +
    console.log("reg number:" + userRegistrationNumber);
    var userName = req.body.username;
    var userAddress = req.body.address;
    var userEmail = req.body.email;
    var userPhone = req.body.phone;
    var userAge = req.body.age;
    var userPlayingLevel = req.body.playingLevel;
    var userExperienceInYears = req.body.yearsOfPlayingExperience;
    var userInstrument = req.body.instrument;
    var userIsLoginCreated = false;
    var userPaymentStatus = "Pending";
    var userStatus = "Inactive";

    const errors = validationResult(req);

    //checking if there are errors
    if (!errors.isEmpty()) {
      //if there are errors
      var errorData = errors.array();

      //send user data to view for preserving it
      var userData = {
        userName: userName,
        userEmail: userEmail,
        userPhone: userPhone,
        userAge: userAge,
        userExperienceInYears: userExperienceInYears,
      };

      var pageData = {
        errors: errorData,
        userData: userData,
      };

      res.render("adminregisterNewStudent", pageData);
    } else {
      // create an object with the fetched data to send to the view
      var pageData = {
        userRegistrationNumber: userRegistrationNumber,
        userName: userName,
        userAddress: userAddress,
        userEmail: userEmail,
        userPhone: userPhone,
        userAge: userAge,
        userPlayingLevel: userPlayingLevel,
        userExperienceInYears: userExperienceInYears,
        userInstrument: userInstrument,
        userIsLoginCreated: userIsLoginCreated,
        userPaymentStatus: userPaymentStatus,
        userStatus: userStatus,
      };
      // Create an instance of the userTicket model, pass the data to be saved and save the entry.
      var newUserRegistration = new RegisteredUser(pageData);

      newUserRegistration.save();

      var responseData = {
        resMessage: "Your request has been successfully submitted",
      };
      // send the data to the view and render it
      res.render("messagePage", responseData);
    }
  }
);

myApp.get("/adminRegisteredStudents", function (req, res) {
  // to fetch the data from DB
  RegisteredUser.find({}).exec(function (err, registeredUsers) {
    var pageData = {
      registeredUsers: registeredUsers,
    };
    res.render("adminRegisteredStudents", pageData); // will render views/list.ejs
    // pass the data fetched from DB to the target page
    // res.render('list', { christmasIds: christmasIds }); // will render views/list.ejs
  });
});

// edit process page to update the data in DB
myApp.post("/editRegisteredSudentsSuccess", async function (req, res) {
  console.log("req body reg:");
  console.log(req.body);
  console.log("req body id length reg:");
  console.log(req.body.id.length);

  if (!mongoose.isObjectIdOrHexString(req.body.id)) {
    for (var i = 0; i < req.body.id.length; i++) {
      //var idString = ().toString();
      RegisteredUser.findByIdAndUpdate(
        req.body.id[i],
        {
          userName: req.body.username[i],
          // userAddress: req.body.address[i],
          userEmail: req.body.userEmail[i],
          userPhone: req.body.userPhone[i],
          userAge: req.body.userAge[i],
          // userPlayingLevel: req.body.playingLevel[i],
          // userExperienceInYears: req.body.yearsOfPlayingExperience[i],
          userInstrument: req.body.userInstrument[i],
          // userIsLoginCreated: req.body.userIsLoginCreated[i],
          // userPaymentStatus: req.body.userPaymentStatus[i],
          // userStatus: req.body.userStatus[i],
        },
        await function (err, docs) {
          if (err) {
            console.log(err);
          } else {
            console.log("Updated Successfully : ");
          }
        }
      );

      // EnrolledUser.findOne({ userRegistrationNumber: req.body.userRegistrationNumber[i] }).exec(await function (err, enrolledUser) {
      //     userName: req.body.username[i];
      //     userLoginName: req.body.userEmail[i];
      //     if (err) {
      //         console.log(err)
      //     }
      //     else {
      //         userName: req.body.userEmail[i];
      //         enrolledUser.save();
      //         console.log("Updated Successfully : ");

      //         //create an object to send to the view
      //         var responseData = {
      //             resMessage: 'Your request has been successfully updated'
      //         }
      //         //create an object to send to the view
      //         res.render('messagePage', responseData);
      //     }

      // });
    }
  } else {
    RegisteredUser.findByIdAndUpdate(
      req.body.id,
      {
        userName: req.body.username,
        // userAddress: req.body.address,
        userEmail: req.body.userEmail,
        userPhone: req.body.userPhone,
        userAge: req.body.userAge,
        // userPlayingLevel: req.body.playingLevel,
        // userExperienceInYears: req.body.yearsOfPlayingExperience,
        userInstrument: req.body.userInstrument,
        // userIsLoginCreated: req.body.userIsLoginCreated,
        //userPaymentStatus: req.body.userPaymentStatus,
        //userStatus: req.body.userStatus,
      },
      await function (err, docs) {
        if (err) {
          console.log(err);
        } else {
          console.log("Updated Successfully : ");
        }
      }
    );
  }
});

myApp.get("/adminEnrolledStudents", function (req, res) {
  // to fetch the data from DB
  EnrolledUser.find({}).exec(function (err, enrolledUsers) {
    var pageData = {
      enrolledUsers: enrolledUsers,
    };
    res.render("adminEnrolledStudents", pageData); // will render views/list.ejs
    // pass the data fetched from DB to the target page
    // res.render('list', { christmasIds: christmasIds }); // will render views/list.ejs
  });
});

// edit process page to update the data in DB
myApp.post("/editEnrolledSudentsSuccess", function (req, res) {
  console.log("req body:");
  console.log(req.body);
  console.log("req body length:");
  console.log(req.body.id.length);
  if (!mongoose.isObjectIdOrHexString(req.body.id)) {
    for (var i = 0; i < req.body.id.length; i++) {
      EnrolledUser.findByIdAndUpdate(
        req.body.id[i],
        {
          userName: req.body.username[i],
          userLoginName: req.body.userLoginName[i],
          userPassword: req.body.userPassword[i],
          // userIsLoginCreated: req.body.userIsLoginCreated[i],
          // userPaymentStatus: req.body.userPaymentStatus[i],
          // userStatus: req.body.userStatus[i]
        },
        function (err, docs) {
          if (err) {
            console.log(err);
          } else {
            console.log("Updated Successfully : ");
          }
        }
      );
    }
  } else {
    EnrolledUser.findByIdAndUpdate(
      req.body.id,
      {
        userName: req.body.username,
        userLoginName: req.body.userLoginName,
        userPassword: req.body.userPassword,
        // userIsLoginCreated: req.body.userIsLoginCreated,
        // userPaymentStatus: req.body.userPaymentStatus,
        // userStatus: req.body.userStatus
      },
      function (err, docs) {
        if (err) {
          console.log(err);
        } else {
          console.log("Updated Successfully : ");
        }
      }
    );
  }
  // console.log('enrolledUsersArray:');
  // console.log(enrolledUsersArray);
  var responseData = {
    resMessage: "Your request has been successfully updated",
  };
  //create an object to send to the view
  res.render("messagePage", responseData);
});

// myApp.get('/adminCreateStudentLogin', function (req, res) {
//     res.render('adminCreateStudentLogin.ejs'); // will render views/faq.ejs
// });

// myApp.post('/adminCreateLogin', function (req, res) {

//     // fetching the user inputs
//     console.log("Request Body");
//     console.log(req.body);
//     var userName = req.body.username;
//     var userLoginName = req.body.userLoginName;
//     var userPassword = req.body.password;
//     var userIsLoginCreated = true;
//     var userPaymentStatus = "clear";
//     var userStatus = "active";

//     // create an object with the fetched data to send to the view
//     var pageData = {
//         userName: userName,
//         userLoginName: userLoginName,
//         userPassword: userPassword,
//         userIsLoginCreated: userIsLoginCreated,
//         userPaymentStatus: userPaymentStatus,
//         userStatus: userStatus
//     }

//     // Create an instance of the userTicket model, pass the data to be saved and save the entry.
//     var newUserEnrollment = new EnrolledUser(pageData);
//     newUserEnrollment.save();
//     var responseData = {
//         resMessage: 'Your request has been successfully submitted'
//     }
//     // send the data to the view and render it
//     res.render('messagePage', responseData);
// });

myApp.get("/confirmRegistration/:id", function (req, res) {
  var id = req.params.id;
  var userRegistrationNumber;
  var userName;
  var userEmail;
  var userPassword;
  var userIsLoginCreated;
  var userPaymentStatus;
  var userStatus;
  var userInstrument;

  RegisteredUser.findById(id, function (err, docs) {
    if (err) {
      console.log(err);
      var responseData = {
        resMessage: err.message,
      };
      res.render("messagePage", responseData);
    } else {
      console.log("INSIDE OUTER ELSE");
      userRegistrationNumber = docs.userRegistrationNumber;
      userName = docs.userName;
      userInstrument = docs.userInstrument;
      userEmail = docs.userEmail;
      userPassword =
        "DMA@" + docs.userName.replace(/\s/g, "-") + "_" + docs.userAge;
      userIsLoginCreated = true;
      userPaymentStatus = "clear";
      userStatus = "active";

      EnrolledUser.findOne(
        { userRegistrationNumber: userRegistrationNumber },
        function (err, enrolledUersData) {
          if (enrolledUersData) {
            console.log("INSIDE inner if");
            var responseData = {
              resMessage: "The student is already enrolled",
            };
            res.render("messagePage", responseData);
          } else {
            console.log("INSIDE inner else");
            var pageData = {
              userRegistrationNumber: userRegistrationNumber,
              userName: userName,
              userInstrument: userInstrument,
              userLoginName: userEmail,
              userPassword: userPassword,
              userIsLoginCreated: userIsLoginCreated,
              userPaymentStatus: userPaymentStatus,
              userStatus: userStatus,
            };

            // Create an instance of the userTicket model, pass the data to be saved and save the entry.
            var newUserEnrollment = new EnrolledUser(pageData);
            newUserEnrollment.save();

            var responseData = {
              resMessage: "Your request has been successfully submitted",
            };
            res.render("messagePage", responseData);
          }
        }
      );
    }
  });

  // send the data to the view and render it
});

// enrollment delete
myApp.get("/delete/enrolledUser/:id", function (req, res) {
  //let proceed only if user is logged in
  if (req.session.loggedIn) {
    var id = req.params.id;
    //res.send('the id is ' + id);

    // DB Method to find and delete the record with a specific attribute
    EnrolledUser.findByIdAndDelete({ _id: id }).exec(function (
      err,
      enrolledUserData
    ) {
      var message = "Sorry, request not found"; // by default assume card not found
      if (enrolledUserData) {
        // if card exists, then change the message
        message = "The request has been successfully deleted ";
      }
      //create an object to send to the view
      var responseData = {
        resMessage: message,
      };
      //create an object to send to the views
      res.render("messagePage", responseData);
    });
  }
  //else redirect to the login page back
  else {
    res.redirect("/login");
  }
});

// registration delete
myApp.get("/delete/registeredUser/:id", function (req, res) {
  //let proceed only if user is logged in
  if (req.session.loggedIn) {
    var id = req.params.id;
    //res.send('the id is ' + id);

    // DB Method to find and delete the record with a specific attribute
    RegisteredUser.findByIdAndDelete({ _id: id }).exec(function (
      err,
      registeredUserData
    ) {
      var message = "Sorry, request not found"; // by default assume card not found
      if (registeredUserData) {
        // if card exists, then change the message
        message = "The request has been successfully deleted ";
      }
      //create an object to send to the view
      var responseData = {
        resMessage: message,
      };
      //create an object to send to the views
      res.render("messagePage", responseData);
    });
  }
  //else redirect to the login page back
  else {
    res.redirect("/login");
  }
});

myApp.post("/adminUploadNewDocProcess", function (req, res) {
  var instrument = req.body.instrumentName;
  var category =
    req.body.categoryName == "instrumentSpecific"
      ? req.body.instrumentName
      : req.body.categoryName;
  var document = req.body.docName;
  var subcategory = req.body.subcategoryName;

  var notesData = {
    instrument: instrument,
    category: category,
    filename: document,
    subcategory: subcategory,
  };

  // Create an instance of the admin model, pass the data to be saved and save the entry.
  var newNotes = new Notes(notesData);
  newNotes.save();
  var responseData = {
    resMessage: "Your request has been successfully submitted",
  };

  // send the data to the view and render it
  res.render("messagePage", responseData);
});

myApp.get("/faq", function (req, res) {
  res.render("faq"); // will render views/faq.ejs
});
myApp.get("/instrument_Rent_Purchase", function (req, res) {
  var pageData = {
    sessionLoggedIn: req.session.loggedIn,
    userInstrument: globalInstrument,
  };
  res.render("instrumentRentPurchase", pageData); // will render views/instrumentRentPurchase.ejs
});
myApp.get("/login", function (req, res) {
  res.render("login"); // will render views/login.ejs
});

myApp.get("/adminUploadNewDoc", function (req, res) {
  res.render("adminUploadNewDocument"); // will render views/login.ejs
});

myApp.get("/register", function (req, res) {
  res.render("register"); // will render views/register.ejs
});
myApp.get("/adminRegisterNewStudent", function (req, res) {
  res.render("adminRegisterNewStudent"); // will render views/adminRegisterNewStudent.ejs
});
myApp.get("/teachers", function (req, res) {
  var pageData = {
    sessionLoggedIn: req.session.loggedIn,
    userInstrument: globalInstrument,
  };
  res.render("teachers", pageData); // will render views/teachers.ejs
});
myApp.get("/testimonials", function (req, res) {
  res.render("testimonials"); // will render views/testimonials.ejs
});
myApp.get("/rockAndOrchestraCamp", function (req, res) {
  var pageData = {
    sessionLoggedIn: req.session.loggedIn,
    userInstrument: globalInstrument,
  };
  res.render("rockAndOrchestraCamp", pageData); // will render views/rockAndOrchestraCamp.ejs
});
myApp.get("/musicLessons", function (req, res) {
  var pageData = {
    sessionLoggedIn: req.session.loggedIn,
    userInstrument: globalInstrument,
  };
  res.render("musicLessons", pageData); // will render views/musicLessons.ejs
});

// //menu classNotes without instrument fetched
// myApp.get('/classNotes', function (req, res) {

//     if (!req.session.loggedIn) {

//         //redirect to login page when user not logged in
//         res.redirect('/login');
//     }
//     else {

//     }

// });

myApp.get("/classNotes/:userInstrument", function (req, res) {
  if (req.session.loggedIn) {
    var userInstrumentParam = req.params.userInstrument.toLowerCase();
    var welcomeNotes = [];
    var theoryNotes = [];
    var recitalsNotes = [];
    var concertsNotes = [];
    var instrumentSpecificNotes = [];
    Notes.find({ instrument: [userInstrumentParam, "na"] }).exec(function (
      err,
      notesData
    ) {
      for (classNote of notesData) {
        if (classNote.category == "welcome") {
          welcomeNotes.push(classNote);
        } else if (classNote.category == "theory") {
          theoryNotes.push(classNote);
        } else if (classNote.category == "recitals") {
          recitalsNotes.push(classNote);
        } else if (classNote.category == "concerts") {
          concertsNotes.push(classNote);
        } else if (classNote.category == userInstrumentParam) {
          instrumentSpecificNotes.push(classNote);
        }
      }
      var pageData = {
        classNotes: notesData,
        welcomeNotes: welcomeNotes,
        theoryNotes: theoryNotes,
        recitalsNotes: recitalsNotes,
        concertsNotes: concertsNotes,
        userInstrument: userInstrumentParam,
      };
      res.render("classNotesAndWorksheets", pageData);
    });
  } else {
    var pageData = {
      error: "Unauthorised Access! Try Again",
    };
    // stay on login page only
    res.redirect("login", pageData);
  }

  // will render views/classNotesAndWorksheets.ejs
});

myApp.get("/pdf/:folderName/:fileName", (req, res) => {
  var folderName = req.params.folderName;
  var fieName = req.params.fileName;
  const filePath =
    __dirname + "/public/documents/" + folderName + "/" + fieName; //10 stave-No bars.pdf
  res.sendFile(filePath);
});

myApp.get("/adminDashboard", function (req, res) {
  if (req.session.loggedIn) {
    RegisteredUser.find({}).exec(function (err, studentInformations) {
      var pageData = {
        studentInformations: studentInformations,
      };
      res.render("adminDashboard", pageData); //will render views/adminDashboard.ejs
    });
  } else {
    //redirect to login page when user not logged in
    res.redirect("/login");
  }
  // res.render('adminDashboard'); // will render views/adminDashboard.ejs
});

// start the server and listen at a port
myApp.listen(8010);

//tell everything was ok
console.log("Everything executed fine.. Open http://localhost:8010/");
