const next = require("next");
const routes = require("./routes");
const app = next({ dev: process.env.NODE_ENV !== "production" });
const handle = routes.getRequestHandler(app);
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const database = require("./db.config");
const Pusher = require("pusher");
const bcrypt = require("bcrypt-nodejs");
const saltRounds = 10;
const jwtDecode = require("jwt-decode");
const nodemailer = require("nodemailer");
const SqlString = require("sqlstring");
const Web3 = require("web3");
const web3 = new Web3();
const cors = require("cors");
const fileUpload = require("express-fileupload");

const bodyParser = require("body-parser");
const urlEncodedParser = bodyParser.urlencoded({ extended: false });

//jwt secret
const secret = "Your JWT Secret";
//nodemailer secret
const EMAIL_SECRET = "Your Nodemailer Secret";

const date = require("date-and-time");

//Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "e.g. Gmail",
  auth: {
    user: "Your admin email address",
    pass: "Your admin email password"
  }
});

//Pusher setup
const pusher = new Pusher({
  appId: "Your appId",
  key: "Your API key",
  secret: "Your secret",
  cluster: "e.g. eu",
  encrypted: true
});

const express = require("express");

app
  .prepare()
  .then(() => {
    const server = express();

    server.use(bodyParser.text());
    server.use(bodyParser.json());

    server.use(cors());

    server.use(cookieParser());
    server.use(fileUpload());

    //Registration of person
    server.post("/register", urlEncodedParser, (req, response) => {
      //get files from client
      let image = req.files.file1;
      let image2 = req.files.file2;

      //rename the files with the username
      let imageName = `${req.body.username}-${image.name}`;
      let imageName2 = `${req.body.username}-${image2.name}`;

      //Hash the password before storing in DB
      bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(req.body.password, salt, null, function(err, hash) {
          let now = date.format(new Date(), "DD.MM.YYYY HH:mm:ss [GMT]Z");
          let nowShort = date.format(new Date(), "DD.MM.YY");
          let body = req.body;

          //prevent sql injection by escaping user input
          //insertdata received in users db table
          let insertSQL = SqlString.format(
            "INSERT INTO users SET username=?, password=?, fname=?, lname=?, street=?, houseNr=?, postCode=?, placeOfRes=?, dateOfBirth=?, nat=?, email=?, mobNr=?, ID1=?, ID2=?, regDate=?, isComp=?, lastModified=?, idNum=?, idType=?",
            [
              body.username,
              hash,
              body.fname,
              body.lname,
              body.street,
              body.houseNr,
              body.postCode,
              body.placeOfRes,
              body.dateOfBirth,
              body.nat,
              body.email,
              body.mobNr,
              imageName,
              imageName2,
              now,
              0,
              nowShort,
              body.idNum,
              body.idType
            ]
          );
          //search for username in db
          let searchSQL = SqlString.format(
            "SELECT * FROM users WHERE username=?",
            [body.username]
          );
          //search for email address in db
          let searchEmail = SqlString.format(
            "SELECT * FROM users WHERE email=?",
            [body.email]
          );
          database.connection.query(searchSQL, function(err, res) {
            if (err) {
              response
                .status(400)
                .json({ message: "Database Server is not connected!" });
            } else {
              //check if username exists
              if (res.length) {
                response.status(400).json({
                  success: false,
                  message: "Username already exists! Choose a different one."
                });
                console.log("User already exists");
              } else {
                //check if email address exists
                database.connection.query(searchEmail, function(err, res) {
                  if (err) {
                    response
                      .status(400)
                      .json({ message: "Database Server is not connected!" });
                  } else {
                    if (res.length) {
                      response.status(400).json({
                        success: false,
                        message: "Email already exists! Choose a different one."
                      });
                      console.log("Email already exists");
                    } else {
                      database.connection.query(insertSQL, function(
                        err,
                        result
                      ) {
                        if (err) {
                          response.status(400).json({
                            message: "Database Server is not connected!"
                          });
                        } else {
                          //sign a token and send it via email to user
                          jwt.sign(
                            {
                              username: body.username,
                              emailToken: crypto
                                .createHash("sha256")
                                .update(body.username)
                                .digest("hex")
                            },
                            EMAIL_SECRET,
                            {
                              expiresIn: 36000 //1h
                            },
                            (err, emailToken) => {
                              const url = `http://localhost:3000/activate/${emailToken}`;
                              transporter.sendMail({
                                from: "Your admin email address",
                                to: body.email,
                                subject: "Confirm Email",
                                html: `Please click this link to confirm your email: <br/><a href="${url}">${url}</a>`
                              });
                            }
                          );
                          //store image in static folder
                          image.mv("static/" + imageName, function(err) {
                            if (err) return response.status(500).send(err);
                          });
                          image2.mv("static/" + imageName2, function(err) {
                            if (err) return response.status(500).send(err);
                          });
                          response.status(200).json({
                            success: true,
                            message: "successfully registered!"
                          });
                          console.log("1 record inserted");
                        }
                      });
                    }
                  }
                });
              }
            }
          });
        });
      });
    });

    //Registration for companies
    server.post("/companyregister", urlEncodedParser, function(req, response) {
      //get files from client
      let image = req.files.file1;
      let image2 = req.files.file2;
      let doc = req.files.doc1;
      let doc2 = req.files.doc2;

      //rename the files with the username
      let imageName = `${req.body.username}-${image.name}`;
      let imageName2 = `${req.body.username}-${image2.name}`;
      let docName = `${req.body.username}-${doc.name}`;
      let docName2 = `${req.body.username}-${doc2.name}`;

      //hash password before storing in DB
      bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(req.body.password, salt, null, function(err, hash) {
          let now = date.format(new Date(), "DD.MM.YYYY HH:mm:ss [GMT]Z");
          let nowShort = date.format(new Date(), "DD.MM.YY");
          let body = req.body;

          //prevent sql injection by escaping user input
          //insertdata received in users db table
          let insertSQL = SqlString.format(
            "INSERT INTO users SET username=?, password=?, fname=?, lname=?, street=?, houseNr=?, postCode=?, placeOfRes=?, dateOfBirth=?, nat=?, email=?, mobNr=?, ID1=?, ID2=?, regDate=?, compName=?, compPostCode=?, residence=?, businessAd=?, compHouseNr=?, doc1=?, doc2=?, isComp=?, lastModified=?, idNum=?, idType=?",
            [
              body.username,
              hash,
              body.fname,
              body.lname,
              body.street,
              body.houseNr,
              body.postCode,
              body.placeOfRes,
              body.dateOfBirth,
              body.nat,
              body.email,
              body.mobNr,
              imageName,
              imageName2,
              now,
              body.compName,
              body.compPostCode,
              body.residence,
              body.businessAd,
              body.compHouseNr,
              docName,
              docName2,
              1,
              nowShort,
              body.idNum,
              body.idType
            ]
          );
          //search for username in db
          let searchSQL = SqlString.format(
            "SELECT * FROM users WHERE username=?",
            [body.username]
          );
          //search for email address in db
          let searchEmail = SqlString.format(
            "SELECT * FROM users WHERE email=?",
            [body.email]
          );
          database.connection.query(searchSQL, function(err, res) {
            if (err) {
              response
                .status(400)
                .json({ message: "Database Server is not connected!" });
            } else {
              //check if username exists
              if (res.length) {
                response.status(400).json({
                  success: false,
                  message: "Username already exists! Choose a different one."
                });
                console.log("User already exists");
              } else {
                //check if email address exists
                database.connection.query(searchEmail, function(err, res) {
                  if (err) {
                    response
                      .status(400)
                      .json({ message: "Database Server is not connected!" });
                  } else {
                    if (res.length) {
                      response.status(400).json({
                        success: false,
                        message: "Email already exists! Choose a different one."
                      });
                      console.log("Email already exists");
                    } else {
                      database.connection.query(insertSQL, function(
                        err,
                        result
                      ) {
                        if (err) {
                          response.status(400).json({
                            message: "Database Server is not connected!"
                          });
                        } else {
                          jwt.sign(
                            {
                              username: body.username,
                              emailToken: crypto
                                .createHash("sha256")
                                .update(body.username)
                                .digest("hex")
                            },
                            EMAIL_SECRET,
                            {
                              expiresIn: 36000 //1h
                            },
                            (err, emailToken) => {
                              const url = `http://localhost:3000/activate/${emailToken}`;
                              transporter.sendMail({
                                from: "Your admin email address",
                                to: body.email,
                                subject: "Confirm Email",
                                html: `Please click this link to confirm your email: <br/><a href="${url}">${url}</a>`
                              });
                            }
                          );
                          //storing documents in DB
                          image.mv("static/" + imageName, function(err) {
                            if (err) return response.status(500).send(err);
                          });
                          image2.mv("static/" + imageName2, function(err) {
                            if (err) return response.status(500).send(err);
                          });
                          doc.mv("static/" + docName, function(err) {
                            if (err) return response.status(500).send(err);
                          });
                          doc2.mv("static/" + docName2, function(err) {
                            if (err) return response.status(500).send(err);
                          });
                          response.status(200).json({
                            success: true,
                            message: "successfully registered!"
                          });
                          console.log("1 record inserted");
                        }
                      });
                    }
                  }
                });
              }
            }
          });
        });
      });
    });

    //Login handler
    server.post("/authenticate", (req, response) => {
      let body = req.body;
      //preventing SQL injection
      let searchUserName = SqlString.format(
        "SELECT * FROM users WHERE username=?",
        [body.username]
      );
      database.connection.query(searchUserName, function(err, result, fields) {
        if (err) {
          response
            .status(400)
            .json({ message: "Database Server is not connected!" });
        } else if (!result.length) {
          //checking if username exists
          response
            .status(400)
            .json({ message: "Username or password is incorrect!" });
        } else if (result[0].active == "0") {
          //checking if account is activated
          response
            .status(400)
            .json({ message: "You have not confirmed your Email address!" });
        } else {
          //compare password from DB with password from login
          if (result.length) {
            bcrypt.compare(body.password, result[0].password, function(
              err,
              res
            ) {
              if (res) {
                //when admin, sign admin token
                if (result[0].privileges == "admin") {
                  let adminToken = jwt.sign(
                    {
                      username: body.username,
                      role: 1,
                      reg: 1,
                      xsrfToken: crypto
                        .createHash("sha256")
                        .update(body.username)
                        .digest("hex")
                    },
                    secret,
                    {
                      expiresIn: 36000 //1h
                    }
                  );
                  response.status(200).json({
                    success: true,
                    message: "Enjoy your token",
                    adminToken: adminToken,
                    registerStatus: result[0].isRegistered,
                    privileg: result[0].privileges
                  });
                  //when registered user, sign user token
                } else if (
                  result[0].privileges == "user" &&
                  result[0].isRegistered == "yes" &&
                  result[0].kycKey != "declined"
                ) {
                  let userToken = jwt.sign(
                    {
                      username: body.username,
                      role: 0, //user
                      reg: 1, //registered
                      xsrfToken: crypto
                        .createHash("sha256")
                        .update(body.username)
                        .digest("hex")
                    },
                    secret,
                    {
                      expiresIn: 36000 //1h
                    }
                  );
                  response.status(200).json({
                    success: true,
                    message: "Enjoy your token",
                    userToken: userToken,
                    registerStatus: result[0].isRegistered,
                    privileg: result[0].privileges
                  });
                  //when user declined, block account
                } else if (result[0].kycKey == "declined") {
                  response.status(200).json({
                    success: true,
                    message:
                      "This username has been declined. You cannot login!",
                    declined: "declined"
                  });
                  //when not registered, sign register token
                } else {
                  let registerToken = jwt.sign(
                    {
                      username: body.username,
                      role: 0,
                      reg: 0,
                      paid: 0,
                      xsrfToken: crypto
                        .createHash("sha256")
                        .update(body.username)
                        .digest("hex")
                    },
                    secret,
                    {
                      expiresIn: 36000 //1h
                    }
                  );
                  response.status(200).json({
                    success: true,
                    message: "Enjoy your token",
                    registerToken: registerToken,
                    registerStatus: result[0].isRegistered,
                    privileg: result[0].privileges
                  });
                }
              } else {
                console.log(err);
                response.status(400).json({
                  success: false,
                  message: "Username or Password is not correct!"
                });
              }
            });
          } else {
            console.log(err);
            response.status(400).json({
              success: false,
              message: "Username or Password is not correct!"
            });
          }
        }
      });
    });

    //Account activation from email
    server.get("/activate/:token", urlEncodedParser, (req, response) => {
      try {
        //verify token stored in confirmation link
        jwt.verify(req.params.token, EMAIL_SECRET, async (err, decoded) => {
          if (err) {
            response.redirect("/login");
          } else {
            let username = decoded.username;
            let sql = SqlString.format(
              "UPDATE users SET active=? WHERE username=?",
              [1, username]
            );
            //activate account in DB
            await database.connection.query(sql, function(err, req, res) {
              if (err) {
                response.send("error");
              } else {
                response.redirect("/login");
              }
            });
          }
        });
      } catch (e) {
        console.log(e);
      }
    });

    //resend the confirmation email
    server.post("/resendConfirmEmail", urlEncodedParser, (req, response) => {
      //sign token and send email with link
      jwt.sign(
        {
          username: req.body.username,
          emailToken: crypto
            .createHash("sha256")
            .update(req.body.username)
            .digest("hex")
        },
        EMAIL_SECRET,
        {
          expiresIn: 36000 //1h
        },
        (err, emailToken) => {
          const url = `http://localhost:3000/activate/${emailToken}`;
          transporter.sendMail({
            from: "Your admin email address",
            to: req.body.email,
            subject: "Confirm Email",
            html: `Please click this link to confirm your email: <br/><a href="${url}">${url}</a>`
          });
        }
      );
      response.status(200).json({
        success: true,
        message: "successfully registered!"
      });
    });

    //resend password reset email
    server.post("/resendPwEmail", urlEncodedParser, (req, response) => {
      //sign token and send email with link
      jwt.sign(
        {
          username: req.body.username,
          pwResetToken: crypto
            .createHash("sha256")
            .update(req.body.username)
            .digest("hex")
        },
        EMAIL_SECRET,
        {
          expiresIn: 36000 //1h
        },
        (err, pwResetToken) => {
          const url = `http://localhost:3000/passwordchange/${pwResetToken}`;
          transporter.sendMail({
            from: "Your admin email address",
            to: req.body.email,
            subject: "Password Reset",
            html: `Please click on the link to reset your password: <br/><a href="${url}">${url}</a>`
          });
          if (err) {
            throw err;
          }
        }
      );
      response.status(200).json({
        success: true,
        message: "successfully registered!"
      });
    });

    //receive username and email address to send email
    server.post("/passwordreset", async (req, res) => {
      let body = req.body;
      let sql = SqlString.format("SELECT * FROM users WHERE username=?", [
        body.username
      ]);
      await database.connection.query(sql, async (err, result, fields) => {
        if (err) {
          res
            .status(400)
            .json({ message: "Database Server is not connected!" });
        } else {
          if (result.length && result[0].email == body.email) {
            //if username and email address match, send email with password reset link
            await jwt.sign(
              {
                username: body.username,
                pwResetToken: crypto
                  .createHash("sha256")
                  .update(body.username)
                  .digest("hex")
              },
              EMAIL_SECRET,
              {
                expiresIn: 36000 //1h
              },
              (err, pwResetToken) => {
                const url = `http://localhost:3000/passwordchange/${pwResetToken}`;
                transporter.sendMail({
                  from: "Your admin email address",
                  to: body.email,
                  subject: "Password Reset",
                  html: `Please click on the link to reset your password: <br/><a href="${url}">${url}</a>`
                });
              }
            );
            setTimeout(function() {
              res.status(200).json({
                success: true
              });
            }, 3000);
          } else {
            res
              .status(400)
              .json({ message: "Username and Email do not match!" });
          }
        }
      });
    });

    //change password in DB
    server.post("/changepw", (req, response) => {
      let searchSQL = SqlString.format(
        "SELECT * FROM users WHERE username =?",
        [req.body.username]
      );
      database.connection.query(searchSQL, (err, result) => {
        if (result.length) {
          //hash the new password
          bcrypt.genSalt(saltRounds, function(err, salt) {
            bcrypt.hash(req.body.password, salt, null, function(err, hash) {
              let updatePw = SqlString.format(
                "UPDATE users SET password=? WHERE username=?",
                [hash, req.body.username]
              );
              database.connection.query(updatePw, (err, res) => {
                if (err) {
                  console.log(err);
                  response.status(400).json({
                    message: "Database Server is not connected!"
                  });
                } else {
                  response.status(200).json({
                    success: true
                  });
                }
              });
            });
          });
        } else {
          console.log("Error /changepw");
        }
      });
    });

    //Verify password reset link
    server.get("/passwordchange/:id", (req, res, next) => {
      try {
        //verify token stored in the link
        jwt.verify(req.params.id, EMAIL_SECRET, (err, decoded) => {
          if (err) {
            response.redirect("/login");
          } else {
            next();
          }
        });
      } catch (e) {
        console.log(e);
      }
    });

    //Get current user
    server.post("/currentuser", urlEncodedParser, function(req, response) {
      //request cookie from browser
      //decode token in cookie to get the username
      let cookie = req.cookies["x-access-token"];
      let decoded = jwtDecode(cookie);
      let currentUser = decoded.username;
      let token = decoded.xsrfToken;
      response.status(200).json({
        success: true,
        currentUser: currentUser,
        token: token,
        cookie: cookie
      });
    });

    //serve client with user data
    server.post("/users", urlEncodedParser, function(req, response) {
      //get current user
      let cookie = req.cookies["x-access-token"];
      let decoded = jwtDecode(cookie);
      let currentUser = decoded.username;
      let searchUser = SqlString.format(
        "SELECT * FROM users WHERE username=?; SELECT DISTINCT * FROM beneficialOwners WHERE username=?",
        [currentUser, currentUser]
      );
      //send data from DB to client
      database.connection.query(searchUser, function(err, res, fields) {
        if (err) {
          throw err;
        } else {
          response.status(200).send({
            success: true,
            userData: res[0],
            beneficialOwners: res[1],
            isComp: res[0].isComp
          });
        }
      });
    });

    //receive changed data from users in profile page
    //change edit state to corresponding field
    server.post("/editData", urlEncodedParser, function(req, response) {
      let body = req.body;
      //set latest modified date
      let now = date.format(new Date(), "DD.MM.YY");

      //change user's address
      let editAddress = SqlString.format(
        "UPDATE users SET street=?, houseNr=?, postCode=?, placeOfRes=?, edited=?, lastModified=? WHERE username=?",
        [
          body.street,
          body.houseNr,
          body.postCode,
          body.placeOfRes,
          "address",
          now,
          body.username
        ]
      );

      //change user's email address
      let editEmail = SqlString.format(
        "UPDATE users SET email=?, edited=?, lastModified=? WHERE username=?",
        [body.email, "email", now, body.userName]
      );

      //change user's mobile number
      let editMobile = SqlString.format(
        "UPDATE users SET mobNr=?, edited=?, lastModified=? WHERE username=?",
        [body.mobNr, "mobNr", now, body.userName]
      );

      //change company's name
      let editCompName = SqlString.format(
        "UPDATE users SET compName=?, edited=?, lastModified=? WHERE username=?",
        [body.compName, "compName", now, body.userName]
      );

      //change company's address
      let editCompAddress = SqlString.format(
        "UPDATE users SET businessAd=?, compHouseNr=?, compPostCode=?, residence=?, edited=?, lastModified=? WHERE username=?",
        [
          body.businessAd,
          body.compHouseNr,
          body.compPostCode,
          body.residence,
          "compAddress",
          now,
          body.username
        ]
      );
      //check whether address, email, mobile, company name or company address are undefined
      //if not undefined, execute corresponding sql query
      if (body.street !== undefined) {
        database.connection.query(editAddress, function(err, res, fields) {
          if (err) throw err;
          response.status(200).json({ success: true });
        });
      } else if (body.email !== undefined) {
        database.connection.query(editEmail, function(err, res, fields) {
          if (err) throw err;
          response.status(200).json({ success: true });
        });
      } else if (body.mobNr !== undefined) {
        database.connection.query(editMobile, function(err, res, fields) {
          if (err) throw err;
          response.status(200).json({ success: true });
        });
      } else if (body.compName !== undefined) {
        database.connection.query(editCompName, function(err, res, fields) {
          if (err) throw err;
          response.status(200).json({ success: true });
        });
      } else if (body.businessAd !== undefined) {
        database.connection.query(editCompAddress, function(err, res, fields) {
          if (err) throw err;
          response.status(200).json({ success: true });
        });
      }
    });

    //changes edit state to null after Admin has reviewed the changes
    server.post("/changeEdit", urlEncodedParser, function(req, response) {
      let userName = req.body.userName;
      let changeEdited = SqlString.format(
        "UPDATE users SET edited=? WHERE username=?",
        [null, userName]
      );
      database.connection.query(changeEdited, function(err, res, fields) {
        if (err) throw err;
        response.status(200).json({ success: true });
      });
    });

    //Gets list of specific user from Client
    server.post("/usrs", urlEncodedParser, function(req, response) {
      //get current user from client
      let currentUser = req.body.currentUser;
      //join users and ethAddresses table
      //get data from benficialOwners table
      let join = SqlString.format(
        "SELECT DISTINCT * FROM users LEFT JOIN ethAddresses ON users.kycHash = ethAddresses.kycHash WHERE username=?; SELECT DISTINCT * FROM beneficialOwners WHERE username=?",
        [currentUser, currentUser]
      );
      database.connection.query(join, function(err, res, fields) {
        if (err) {
          throw err;
        } else {
          response.status(200).send({
            success: true,
            userData: res[0],
            beneficialOwners: res[1]
          });
        }
      });
    });

    //send otp via email to user
    server.post("/createOTP", urlEncodedParser, (req, response) => {
      let body = req.body;
      let otpToken = body.otpToken;
      let userName = body.userName;
      let searchEmail = SqlString.format(
        "SELECT email FROM users WHERE username=?",
        [userName]
      );
      let insertOtpSecret = SqlString.format(
        "UPDATE users SET otpToken=? WHERE username=?",
        [otpToken, userName]
      );
      //get email address from user and send otp
      database.connection.query(searchEmail, function(err, res) {
        if (err) {
          throw err;
        } else {
          transporter.sendMail({
            from: "Your admin email address",
            to: res[0].email,
            subject: "OTP",
            html: `Your OTP: ${otpToken}`
          });
          if (err) {
            console.log(err);
          } else {
            //insert otptoken (temporarily) and name of the audio file
            database.connection.query(insertOtpSecret, function(err, res) {
              if (err) {
                throw err;
              } else {
                response.status(200).json({
                  success: true
                });
              }
            });
          }
        }
      });
    });

    //send otpToken to Client to verify otp entered by the user
    server.post("/otpToken", urlEncodedParser, (req, response) => {
      let getOtpToken = SqlString.format(
        "SELECT otpToken FROM users WHERE otpToken IS NOT NULL"
      );
      database.connection.query(getOtpToken, (err, res) => {
        if (err) {
          throw err;
        } else {
          response
            .status(200)
            .json({ success: true, otpToken: res[0].otpToken });
        }
      });
    });

    // when otp verified, create and store kycKey in DB
    server.post("/approval", urlEncodedParser, (req, response) => {
      let body = req.body;
      let userName = body.userName;
      let audioName = req.body.fileName;
      let audio = req.files.file;
      //create new kycKey
      let newAccount = web3.eth.accounts.create();
      let newKycKey = newAccount.address;

      //hash the kyc key
      let kycHash = web3.utils.soliditySha3(newKycKey);
      //insert kycKey in DB and set user to isregistered
      //set otpToken to null after verification
      let storekycKeyUsers = SqlString.format(
        "UPDATE users SET kycKey=?, isRegistered=?, audio=?, kycHash=? WHERE username=?; UPDATE users SET otpToken=? WHERE username=?",
        [newKycKey, "yes", audioName, kycHash, userName, null, userName]
      );
      //send fields to hash to the client
      let getHashInfo = SqlString.format(
        "SELECT fname, lname, idNum, kycKey FROM users WHERE username=?",
        [userName]
      );
      //initialise ethAddresses where first field is set to null
      let storeEthAddresses = SqlString.format(
        "INSERT INTO ethAddresses SET kycHash=?, ethAddress=?",
        [kycHash, null]
      );
      database.connection.query(storekycKeyUsers, function(err, res, fields) {
        if (err) {
          throw err;
        } else {
          //store audio file in static folder
          audio.mv("static/" + audioName, function(err) {
            if (err) console.log(err);
          });
          database.connection.query(storeEthAddresses, function(
            err,
            res,
            fields
          ) {
            if (err) {
              throw err;
            } else {
              database.connection.query(getHashInfo, (err, res, fields) => {
                if (err) {
                  throw err;
                } else {
                  response.status(200).json({
                    success: true,
                    fname: res[0].fname,
                    lname: res[0].lname,
                    idNum: res[0].idNum,
                    kycKey: res[0].kycKey
                  });
                }
              });
            }
          });
        }
      });
    });

    //is executed when a user has been declined in the videochat
    server.post("/decline", urlEncodedParser, (req, response) => {
      let audioName = req.body.fileName;
      let audio = req.files.file;
      //set kycKey to declined which blocks the user's account
      let declineUser = SqlString.format(
        "UPDATE users SET kycKey=?, isRegistered=?, audio=? WHERE username=?",
        ["declined", "yes", audioName, req.body.userName]
      );
      database.connection.query(declineUser, function(err, res, fields) {
        if (err) throw err;
        response.status(200).json({
          success: true
        });
      });
      //store audio file in static folder
      audio.mv("static/" + audioName, function(err) {
        if (err) return response.status(500).send(err);
      });
    });

    //get all users from users table
    server.post("/userlist", function(req, response) {
      let sql = "SELECT * FROM users";
      database.connection.query(sql, function(err, res, fields) {
        if (err) throw err;
        response.status(200).json({
          success: true,
          userData: res
        });
      });
    });

    //get Snapshot from client and store it in static folder and DB
    server.post("/storeSnapshot", urlEncodedParser, (req, response) => {
      let image = req.files.image;
      let imageName = req.body.imageName;
      let userName = req.body.userName;
      image.mv("static/" + imageName, function(err) {
        if (err) return response.status(500).send(err);
      });
      let storeSnapshot = SqlString.format(
        "UPDATE users SET snapshot=? WHERE username=?",
        [imageName, userName]
      );
      database.connection.query(storeSnapshot, function(err, res, fields) {
        if (err) {
          throw err;
        } else {
          response.status(200).send({
            success: true
          });
        }
      });
    });

    //check whether the user has beneficial owners on his assets
    server.post("/assets", urlEncodedParser, function(req, response) {
      let body = req.body;
      let cookie = req.cookies["x-access-token"];
      let decoded = jwtDecode(cookie);
      let userName = decoded.username;
      //if the user has beneficial owners, store data of the first beneficial owner
      let insertFirst = SqlString.format(
        "INSERT INTO beneficialOwners SET username=?, ownerName=?, ownerLastName=?, ownerStreet=?, ownerHouseNr=?, ownerPostCode=?, ownerPlaceOfRes=?, ownerDateOfBirth=?",
        [
          userName,
          body.ownerFname,
          body.ownerLname,
          body.ownerStreet,
          body.ownerHouseNr,
          body.ownerPostCode,
          body.ownerPlaceOfRes,
          body.ownerDateOfBirth
        ]
      );
      //if the user has two beneficial owners, store data of the second beneficial owner
      let insertSecond = SqlString.format(
        "INSERT INTO beneficialOwners SET username=?, ownerName=?, ownerLastName=?, ownerStreet=?, ownerHouseNr=?, ownerPostCode=?, ownerPlaceOfRes=?, ownerDateOfBirth=?",
        [
          userName,
          body.ownerFname2,
          body.ownerLname2,
          body.ownerStreet2,
          body.ownerHouseNr2,
          body.ownerPostCode2,
          body.ownerPlaceOfRes2,
          body.ownerDateOfBirth2
        ]
      );
      //if the user has three beneficial owners, store data of the third beneficial owner
      let insertThird = SqlString.format(
        "INSERT INTO beneficialOwners SET username=?, ownerName=?, ownerLastName=?, ownerStreet=?, ownerHouseNr=?, ownerPostCode=?, ownerPlaceOfRes=?, ownerDateOfBirth=?",
        [
          userName,
          body.ownerFname3,
          body.ownerLname3,
          body.ownerStreet3,
          body.ownerHouseNr3,
          body.ownerPostCode3,
          body.ownerPlaceOfRes3,
          body.ownerDateOfBirth3
        ]
      );
      database.connection.query(insertFirst, function(err, res, fields) {
        if (err) {
          console.log(err);
        } else {
          if (body.ownerFname2) {
            database.connection.query(insertSecond, function(err, res, fields) {
              if (err) {
                console.log(err);
              } else {
                if (body.ownerFname3) {
                  database.connection.query(insertThird, function(
                    err,
                    res,
                    fields
                  ) {
                    if (err) {
                      console.log(err);
                    } else {
                    }
                  });
                }
              }
            });
          }
          response.status(200).json({
            success: true
          });
        }
      });
    });

    //assign user a new access token and cookie after payment
    server.post("/clickandpay", urlEncodedParser, function(req, response) {
      let cookie = req.cookies["x-access-token"];
      let decoded = jwtDecode(cookie);
      //sign video chat token
      let videoCookie = jwt.sign(
        {
          username: decoded.username,
          role: 0, //user
          reg: 0, //registered
          paid: 1, //has paid
          xsrfToken: crypto
            .createHash("sha256")
            .update(decoded.username)
            .digest("hex")
        },
        secret,
        {
          expiresIn: 36000 //1h
        }
      );
      response.status(200).json({
        success: true,
        videoCookie: videoCookie
      });
    });

    //protects pages from unauthorized users
    server.use(
      unless(
        //list of unprotected pages
        [
          "/login",
          "/register",
          "/_next",
          "/passwordreset",
          "/passwordchange",
          "/validate"
        ],
        (req, res, next) => {
          const token = req.cookies["x-access-token"];
          if (token) {
            //verify the tokens
            jwt.verify(token, secret, (err, decoded) => {
              if (err) {
                //if token expired, redirect to login
                res.redirect("/login");
              } else {
                // if token is verified, redirect user to corresponding page
                req.decoded = decoded;
                next();
              }
            });
          } else {
            res.redirect("/login");
          }
        }
      )
    );

    //redirect index page to login
    server.get("/", (req, res) => {
      res.redirect("/login");
    });

    //protect Admin page
    server.get("/admin", protectedAdminPage, (req, response, next) => {
      return next();
    });

    //protect clickandpay
    server.get("/clickandpay", protectedRegPage, (req, response, next) => {
      return next();
    });

    //protect video chat page
    server.get("/videochat", protectedVideochatPage, (req, response, next) => {
      return next;
    });

    //protect profile page
    server.get("/profile", protectedUserPage, (req, response, next) => {
      return next();
    });

    //User details for videochat
    server.post("/videochat/stream", urlEncodedParser, (req, res) => {
      //user needs token to access video chat
      let cookie = req.cookies["x-access-token"];
      let decoded = jwtDecode(cookie);
      let currentUser = decoded.username;
      let token = decoded.xsrfToken;
      let role = decoded.role;
      res.status(200).send({
        currentUser,
        token: token,
        role: role
      });
    });

    server.post("/videochat/user", urlEncodedParser, function(req, response) {
      //get current user
      let searchUser = SqlString.format(
        "SELECT * FROM users WHERE username=?",
        [req.body.currentUser]
      );
      //send data from DB to client
      database.connection.query(searchUser, function(err, res, fields) {
        if (err) {
          throw err;
        } else {
          response.status(200).send({
            success: true,
            userData: res,
            img1: res[0].ID1,
            img2: res[0].ID2
          });
        }
      });
    });

    //Pusher endpoint to authenticate users
    server.post("/pusher/auth", urlEncodedParser, function(req, res) {
      let cookie = req.cookies["x-access-token"];
      let decoded = jwtDecode(cookie);
      let currentUser = decoded.username;
      let socketId = req.body.socket_id;
      let channel = req.body.channel_name;
      let presenceData = {
        user_id: currentUser
      };

      let auth = pusher.authenticate(socketId, channel, presenceData);
      res.send(auth);
    });

    //process user requests from smart contract
    server.post("/verify", urlEncodedParser, function(req, response) {
      let body = req.body;
      //receive kycKey from the smart contract and verify
      let checkKycKey = SqlString.format(
        "SELECT * FROM users WHERE kycHash=?",
        [body.kycKey]
      );
      database.connection.query(checkKycKey, function(err, result, fields) {
        if (err) {
          console.log("error");
        } else {
          //kycKey verified
          if (result.length) {
            response.status(200).json({
              confirmed: true,
              success: true
            });
            //insert into ethAddresses
            let storeAddress = SqlString.format(
              "INSERT INTO ethAddresses SET kycHash=?, ethAddress=?",
              [body.kycKey, body.platformAddress]
            );
            database.connection.query(storeAddress, function(
              err,
              result,
              fields
            ) {
              if (err) {
                throw err;
              } else {
                console.log("address saved in db");
              }
            });
          } else {
            //wrong kycKey
            if (!result.length) {
              response.status(200).json({
                success: true,
                confirmed: false
              });
              console.log("wrong kycKey");
            }
          }
        }
      });
    });

    server.get("*", (req, res) => {
      return handle(req, res);
    });

    //listen on port 3000
    server.listen(3000, err => {
      if (err) throw err;
      console.log("> Listening on Port 3000");
    });
  })
  .catch(ex => {
    console.error(ex.stack);
    process.exit(1);
  });

// function to protect all pages which require a token
function unless(paths, middleware) {
  return function(req, res, next) {
    let isHave = false;
    paths.forEach(path => {
      if (path === req.path || req.path.includes(path)) {
        isHave = true;
        return;
      }
    });
    if (isHave) {
      return next();
    } else {
      return middleware(req, res, next);
    }
  };
}

//verify token and check whether the user has access to the admin page
function protectedAdminPage(req, res, next) {
  const token = req.cookies["x-access-token"];
  if (token) {
    //verify if user has admin token
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        console.log(err);
      } else {
        if (decoded.role !== 1) {
          res.redirect("/error");
        } else {
          return next();
        }
      }
    });
  } else {
    res.redirect("/login");
  }
}

//verify token and check whether the user has access to the profile page
function protectedUserPage(req, res, next) {
  const token = req.cookies["x-access-token"];
  if (token) {
    //verify if user has user token
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        console.log(err);
      } else {
        if (decoded.role !== 0 || decoded.reg !== 1) {
          res.redirect("/error");
        } else {
          return next();
        }
      }
    });
  } else {
    res.redirect("/login");
  }
}

//verify token and check whether the user has access to the registration page
function protectedRegPage(req, res, next) {
  const token = req.cookies["x-access-token"];
  if (token) {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        console.log(err);
      } else {
        if (decoded.role !== 0 || decoded.reg !== 0) {
          res.redirect("/error");
        } else {
          return next();
        }
      }
    });
  } else {
    res.redirect("/login");
  }
}

//verify token and check whether the user has access to the videochat page
function protectedVideochatPage(req, res, next) {
  const token = req.cookies["x-access-token"];
  if (token) {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        console.log(err);
      } else {
        if (decoded.role !== 0 || decoded.reg !== 0) {
          res.redirect("/error");
        } else if (decoded.paid === 0) {
          res.redirect("/clickandpay");
        } else {
          return next();
        }
      }
    });
  } else {
    res.redirect("/login");
  }
}
