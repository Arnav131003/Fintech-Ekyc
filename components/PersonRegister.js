import React, { Component } from "react";
import { Link, Router } from "../routes";
import { Form, Button, Icon, Popup, Message } from "semantic-ui-react";
import Layout from "./Layout";
import axios from "axios";
import swal from "sweetalert2";

//options for dropdown menu
const idTypeOptions = [
  {
    key: "Swiss Identity Card",
    text: "Swiss Identity Card",
    value: "id"
  },
  { key: "Swiss Drivers License", text: "Swiss Drivers License", value: "dl" }
];

class PersonRegister extends Component {
  constructor() {
    super();
    this.state = {
      errorMessage: "",
      successMessage: "",
      loading: false,
      file1: "",
      file2: "",
      files: [],
      prev1: "",
      prev2: "",
      showResults: false
    };
  }

  //handle form submit and send data to server
  handleSubmit = async () => {
    this.setState({ loading: true });

    const formData = new FormData();
    formData.append("file1", this.state.file1);
    formData.append("file2", this.state.file2);
    formData.append("fname", this.state.fname);
    formData.append("lname", this.state.lname);
    formData.append("street", this.state.street);
    formData.append("houseNr", this.state.houseNr);
    formData.append("postCode", this.state.postCode);
    formData.append("placeOfRes", this.state.placeOfRes);
    formData.append("dateOfBirth", this.state.dateOfBirth);
    formData.append("nat", this.state.nat);
    formData.append("email", this.state.email);
    formData.append("mobNr", this.state.mobNr);
    formData.append("username", this.state.username);
    formData.append("password", this.state.password);
    formData.append("idNum", this.state.idNum);
    formData.append("idType", this.state.idType);
    formData.append("errorMessage", this.state.errorMessage);

    console.log(this.state.idType);

    try {
      const response = await axios.post(
        window.location.origin + "/register",
        formData
      );
      if (response.data.success) {
        //success notification with possibility to resend the confirmation email
        swal({
          title: "Success!",
          text:
            "An email has been sent to you. Please confirm your email address and login to proceed",
          type: "success",
          showCancelButton: true,
          confirmButtonText: "Confirm",
          cancelButtonText: "Resend Email",
          reverseButtons: true
        }).then(result => {
          if (result.value) {
            Router.push("/login");
          } else {
            this.resendEmail();
          }
        });
      }
    } catch (error) {
      this.setState({ errorMessage: error.response.data.message });
    }
    this.setState({ loading: false });
  };

  //resend confirmation email function
  resendEmail = async () => {
    console.log(this.state.email, this.state.username);
    let email = this.state.email;
    let username = this.state.username;
    let response = await axios.post(
      window.location.origin + "/resendConfirmEmail",
      {
        username,
        email
      }
    );
    if (response.data.success) {
      swal({
        title: "Success!",
        text:
          "An email has been sent to you. Please confirm your email address and login to proceed",
        type: "success",
        showCancelButton: true,
        confirmButtonText: "Confirm",
        cancelButtonText: "Resend Email",
        reverseButtons: true
      }).then(result => {
        if (result.value) {
          Router.push("/login");
        } else {
          this.resendEmail();
        }
      });
    }
  };

  //handle file input
  handleFileChange = e => {
    //check if two images have been uplaoded
    if (!e.target.files[0] || !e.target.files[1] || e.target.files[2]) {
      this.setState({ errorMessage: "You have to upload 2 images!" });
    } else {
      this.setState({
        file1: e.target.files[0],
        file2: e.target.files[1],
        //image preview
        prev1: URL.createObjectURL(e.target.files[0]),
        prev2: URL.createObjectURL(e.target.files[1]),
        showResults: true,
        errorMessage: ""
      });
    }
  };

  render() {
    return (
      <div>
        <Layout>
          <br />
          {/* Form to handle inputs */}
          <Form onSubmit={this.handleSubmit} error={this.state.errorMessage}>
            <Form.Group>
              <Form.Input
                width="eight"
                fluid
                label="Username"
                placeholder="Username"
                required
                name="username"
                value={this.state.username}
                onChange={event =>
                  this.setState({ username: event.target.value })
                }
              />
              <Form.Input
                width="eight"
                fluid
                type="password"
                label="Password"
                placeholder="Password"
                required
                name="password"
                value={this.state.password}
                //strong password required
                pattern="^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$"
                onChange={event =>
                  this.setState({ password: event.target.value })
                }
              />
              <Popup
                trigger={
                  <Icon
                    name="question circle outline"
                    style={{ marginRight: "-16px" }}
                  />
                }
                content="The password must contain at least 1 upper case letter, 1 lower case letter, 1 digit, 1 special character and minimum eight in length!"
                hideOnScroll
              />
            </Form.Group>
            <Form.Group widths="equal">
              <Form.Input
                fluid
                label="First Name"
                placeholder="First Name"
                required
                name="fname"
                value={this.state.fname}
                onChange={event => this.setState({ fname: event.target.value })}
              />
              <Form.Input
                fluid
                label="Last Name"
                placeholder="Last Name"
                required
                name="lname"
                value={this.state.lname}
                onChange={event => this.setState({ lname: event.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Input
                width="eleven"
                fluid
                label="Street"
                placeholder="Street"
                required
                name="street"
                value={this.state.street}
                onChange={event =>
                  this.setState({ street: event.target.value })
                }
              />
              <Form.Input
                width="five"
                fluid
                label="House Number"
                required
                placeholder="House Number"
                name="houseNr"
                value={this.state.houseNr}
                onChange={event =>
                  this.setState({ houseNr: event.target.value })
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Input
                width="six"
                fluid
                type="number"
                label="Postal Code"
                required
                placeholder="Postal Code"
                name="postCode"
                value={this.state.postCode}
                onChange={event =>
                  this.setState({ postCode: event.target.value })
                }
              />
              <Form.Input
                width="ten"
                fluid
                label="Place of Residenz"
                required
                placeholder="Place of Residence"
                name="placeOfRes"
                value={this.state.placeOfRes}
                onChange={event =>
                  this.setState({ placeOfRes: event.target.value })
                }
              />
            </Form.Group>
            <Form.Group widths="equal">
              <Form.Input
                fluid
                label="Date of Birth"
                required
                placeholder="DD.MM.YYYY"
                name="dateOfBirth"
                value={this.state.dateOfBirth}
                onChange={event =>
                  this.setState({ dateOfBirth: event.target.value })
                }
              />
              <Form.Input
                fluid
                label="Nationality"
                required
                placeholder="e.g. Switzerland"
                name="nat"
                value={this.state.nat}
                onChange={event => this.setState({ nat: event.target.value })}
              />
            </Form.Group>
            <Form.Group widths="equal">
              <Form.Input
                fluid
                label="Email"
                type="email"
                required
                placeholder="email@email.com"
                name="email"
                value={this.state.email}
                onChange={event => this.setState({ email: event.target.value })}
              />
              <Form.Input
                fluid
                label="Mobile Number"
                type="number"
                required
                placeholder="+4* ** *** ** **"
                name="mobNr"
                value={this.state.mobNr}
                onChange={event => this.setState({ mobNr: event.target.value })}
              />
            </Form.Group>
            <Popup
              trigger={<Icon name="question circle outline" />}
              content={
                <div>
                  <p style={{ fontWeight: "bold" }}>Identity card:</p>
                  <p>upper right on the front</p>
                  <p style={{ fontWeight: "bold" }}>Drivers license:</p>
                  <p>number 5 on the front</p>
                </div>
              }
              hideOnScroll
            />
            <Form.Group widths="equal">
              <Form.Input
                fluid
                label="ID Number"
                required
                name="idNum"
                placeholder="ID Number"
                value={this.state.idNum}
                onChange={event => this.setState({ idNum: event.target.value })}
              />
              <Form.Select
                fluid
                label="ID Type"
                required
                options={idTypeOptions}
                name="idType"
                placeholder="Choose a ID Type"
                onChange={(event, { value }) => {
                  this.setState({ idType: value });
                }}
              />
            </Form.Group>
            <Form.Group>
              <Form.Input
                fluid
                type="file"
                width="sixteen"
                required
                label="ID front- and backside! (.png or .jpg)"
                name="file"
                id="file"
                multiple
                onChange={this.handleFileChange}
              />
            </Form.Group>
            {this.state.showResults ? (
              <div className="image-preview" style={{ marginBottom: "10px" }}>
                <img
                  src={this.state.prev1}
                  style={{
                    width: "200px",
                    height: "113px",
                    float: "left",
                    marginBottom: "12px"
                  }}
                />
                <img
                  src={this.state.prev2}
                  style={{
                    width: "200px",
                    height: "113px",
                    float: "right",
                    marginBottom: "12px"
                  }}
                />
              </div>
            ) : null}
            {this.state.showResults ? (
              <Button
                icon
                loading={this.state.loading}
                fluid
                size="large"
                color="blue"
              >
                Submit
                <Icon name="signup" />
              </Button>
            ) : (
              <Button icon disabled fluid size="large" color="blue">
                Submit
                <Icon name="signup" />
              </Button>
            )}
            <Message error header="Oops!" content={this.state.errorMessage} />
          </Form>
          <br />
          <br />
        </Layout>
      </div>
    );
  }
}

export default PersonRegister;
