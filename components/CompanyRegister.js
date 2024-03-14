import React, { Component } from "react";
import { Link, Router } from "../routes";
import { Form, Button, Icon, Popup, Message, Grid } from "semantic-ui-react";
import Layout from "../components/Layout";
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

class CompanyRegister extends Component {
  constructor() {
    super();
    this.state = {
      errorMessage: "",
      successMessage: "",
      loading: false,
      file1: "",
      file2: "",
      doc1: "",
      doc2: "",
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
    formData.append("compName", this.state.compName);
    formData.append("regNr", this.state.regNr);
    formData.append("compPostCode", this.state.compPostCode);
    formData.append("residence", this.state.residence);
    formData.append("businessAd", this.state.businessAd);
    formData.append("compHouseNr", this.state.compHouseNr);
    formData.append("doc1", this.state.doc1);
    formData.append("doc2", this.state.doc2);

    try {
      const response = await axios.post(
        window.location.origin + "/companyregister",
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
    console.log(this.state.email, this.state.username); //TODO: why undefined?
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
  handleImageFileChange = e => {
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

  //handle document uplaod
  handleDocFileChange = e => {
    this.setState({
      doc1: e.target.files[0]
    });
  };

  //handle document upload
  handleDoc2FileChange = e => {
    this.setState({
      doc2: e.target.files[0]
    });
  };

  render() {
    return (
      <div>
        <Layout>
          <br />
          {/* Form to handle user input */}
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
                //strong password required
                pattern="^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$"
                name="password"
                value={this.state.password}
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
                placeholder="i.e. Switzerland"
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
                // value={this.state.idType}
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
                onChange={this.handleImageFileChange}
              />
            </Form.Group>
            {this.state.showResults ? (
              <div className="image-preview">
                <Grid>
                  <Grid.Column width={8}>
                    <img
                      src={this.state.prev1}
                      style={{ width: "200px", height: "113px", float: "left" }}
                    />
                  </Grid.Column>
                  <Grid.Column width={8}>
                    <img
                      src={this.state.prev2}
                      style={{
                        width: "200px",
                        height: "113px",
                        float: "right"
                      }}
                    />
                  </Grid.Column>
                </Grid>
              </div>
            ) : null}
            <Form.Group />
            <Form.Group>
              <Form.Input
                width="sixteen"
                fluid
                name="compName"
                required
                label="Company Name"
                placeholder="Company Name"
                value={this.state.compName}
                onChange={event =>
                  this.setState({ compName: event.target.value })
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Input
                width="eleven"
                required
                fluid
                name="businessAd"
                label="Business Address"
                placeholder="Business Address"
                value={this.state.businessAd}
                onChange={event =>
                  this.setState({ businessAd: event.target.value })
                }
              />
              <Form.Input
                width="five"
                fluid
                type="number"
                required
                name="compHouseNr"
                label="House Number"
                placeholder="House Number"
                value={this.state.compHouseNr}
                onChange={event =>
                  this.setState({ compHouseNr: event.target.value })
                }
              />
            </Form.Group>
            <Form.Group widths="equal">
              <Form.Input
                width="six"
                fluid
                type="number"
                label="Postal Code"
                required
                placeholder="Postal Code"
                name="compPostCode"
                value={this.state.compPostCode}
                onChange={event =>
                  this.setState({ compPostCode: event.target.value })
                }
              />
              <Form.Input
                width="ten"
                fluid
                label="Place of Residenz"
                required
                placeholder="Place of Residence"
                name="residence"
                value={this.state.residence}
                onChange={event =>
                  this.setState({ residence: event.target.value })
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Input
                fluid
                name="doc1"
                id="doc1"
                required
                type="file"
                width="sixteen"
                label="Electronic extract of the relevant registration authority"
                onChange={this.handleDocFileChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Input
                fluid
                name="doc2"
                id="doc2"
                required
                type="file"
                width="sixteen"
                label="Electronic copy of the power of attorney"
                onChange={this.handleDoc2FileChange}
              />
            </Form.Group>
            {this.state.showResults ? (
              <Button
                icon
                fluid
                size="large"
                loading={this.state.loading}
                color="blue"
              >
                Submit
                <Icon name="signup" />
              </Button>
            ) : (
              <Button icon fluid size="large" disabled color="blue">
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

export default CompanyRegister;
