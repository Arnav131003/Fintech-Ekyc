import React, { Component } from "react";
import { Link, Router } from "../routes";
import {
  Button,
  Checkbox,
  Container,
  Divider,
  Icon,
  Segment,
  Form,
  Message,
  Header
} from "semantic-ui-react";
import Layout from "../components/Layout";
import axios from "axios";
import { setCookie } from "../utils/CookieUtils";
import web3 from "../ethereum/src/web3";
import contract from "../ethereum/src/contract";
import swal from "sweetalert2";

class Assets extends Component {
  constructor() {
    super();
    this.state = {
      loading: false,
      checkedAssets1: false,
      checkedAssets2: false,
      terms: false,
      pay: false,
      error: false,
      etherValue: "",
      metaMask: true,
      waitingForTransactionSuccess: false
    };
  }

  async componentWillMount() {
    //checking whether user is logged in to metamask
    setInterval(() => {
      web3.eth.getAccounts((err, accounts) => {
        if (err != null) console.error("An error occurred: " + err);
        else if (accounts.length == 0) this.setState({ metaMask: false });
        else this.setState({ metaMask: true, myAddress: accounts[0] });
      });
    }, 500); //0.5 seconds
  }

  //handle the checkboxes for beneficial owners
  handleCheckAssets1 = () => {
    if (this.state.checkedAssets2 === true) {
      this.setState({ checkedAssets2: false, checkedAssets1: true });
    }
    this.setState({ checkedAssets1: !this.state.checkedAssets1 });
  };

  //handle the checkboxes for beneficial owners
  handleCheckAssets2 = () => {
    if (this.state.checkedAssets1 === true) {
      this.setState({ checkedAssets1: false, checkedAssets2: true });
    }
    this.setState({ checkedAssets2: !this.state.checkedAssets2 });
  };

  //send beneficial owner data to server
  ownerFormSubmit = async () => {
    this.setState({ loading: true });

    const formData = new FormData();

    //send data of the first beneficial owner because it is required
    formData.append("ownerFname", this.state.ownerFname);
    formData.append("ownerLname", this.state.ownerLname);
    formData.append("ownerStreet", this.state.ownerStreet);
    formData.append("ownerHouseNr", this.state.ownerHouseNr);
    formData.append("ownerPostCode", this.state.ownerPostCode);
    formData.append("ownerPlaceOfRes", this.state.ownerPlaceOfRes);
    formData.append("ownerDateOfBirth", this.state.ownerDateOfBirth);

    //check if the user has entered data for a second beneficial Owner
    if (
      this.state.ownerFname2 &&
      this.state.ownerLname2 &&
      this.state.ownerStreet2 &&
      this.state.ownerHouseNr2 &&
      this.state.ownerPostCode2 &&
      this.state.ownerPlaceOfRes2 &&
      this.state.ownerDateOfBirth2
    ) {
      formData.append("ownerFname2", this.state.ownerFname2);
      formData.append("ownerLname2", this.state.ownerLname2);
      formData.append("ownerStreet2", this.state.ownerStreet2);
      formData.append("ownerHouseNr2", this.state.ownerHouseNr2);
      formData.append("ownerPostCode2", this.state.ownerPostCode2);
      formData.append("ownerPlaceOfRes2", this.state.ownerPlaceOfRes2);
      formData.append("ownerDateOfBirth2", this.state.ownerDateOfBirth2);
    }

    //check if the user has entered data for a third beneficial Owner
    if (
      this.state.ownerFname3 &&
      this.state.ownerLname3 &&
      this.state.ownerStreet3 &&
      this.state.ownerHouseNr3 &&
      this.state.ownerPostCode3 &&
      this.state.ownerPlaceOfRes3 &&
      this.state.ownerDateOfBirth3
    ) {
      formData.append("ownerFname3", this.state.ownerFname3);
      formData.append("ownerLname3", this.state.ownerLname3);
      formData.append("ownerStreet3", this.state.ownerStreet3);
      formData.append("ownerHouseNr3", this.state.ownerHouseNr3);
      formData.append("ownerPostCode3", this.state.ownerPostCode3);
      formData.append("ownerPlaceOfRes3", this.state.ownerPlaceOfRes3);
      formData.append("ownerDateOfBirth3", this.state.ownerDateOfBirth3);
    }

    let response = await axios.post(
      window.location.origin + "/assets",
      formData
    );
    if (response.data.success) {
      this.setState({ loading: false, terms: true, pay: false });
    }
  };

  //execute ether payment
  submit = async () => {
    //get eth accounts
    let accounts = await web3.eth.getAccounts();

    if (this.state.etherValue > 0) {
      this.setState({
        loading: true,
        waitingForTransactionSuccess: true,
        error: false
      });
      //execute payment to admin address if etherValue > 0
      await contract.methods.payKYC().send({
        from: accounts[0],
        value: web3.utils.toWei(this.state.etherValue, "ether"),
        gas: 200000,
        gasPrice: "5000000000"
      });
      swal({
        title: "Thank You!",
        text: "You will be redirected to the video identification",
        type: "success",
        onClose: async () => {
          //get videochat token from server to store in cookie
          let response = await axios.post(
            window.location.origin + "/clickandpay"
          );
          if (response.data.success) {
            console.log("success");
            setCookie("x-access-token", response.data.videoCookie, 1);
            Router.push("/videochat");
          }
        }
      });
    } else if (this.state.etherValue === "") {
      this.setState({ error: true });
    } else {
      //if etherValue = 0 redirect user to video chat
      swal({
        title: "Thank You!",
        text: "You will be redirected to the video identification",
        type: "success",
        onClose: async () => {
          //get videochat token from server to store in cookie
          let response = await axios.post(
            window.location.origin + "/clickandpay"
          );
          if (response.data.success) {
            console.log("success");
            setCookie("x-access-token", response.data.videoCookie, 1);
            Router.push("/videochat");
          }
        }
      });
    }
    this.setState({ loading: false, waitingForTransactionSuccess: false });
  };

  render() {
    return (
      <div>
        <Layout>
          <style>{`
        body {
          background: #e6e6e6;
        }
      `}</style>
          {/* assets view */}
          {this.state.terms == false && this.state.pay == false ? (
            <Segment style={{ marginTop: "50px" }}>
              <br />
              <Header
                as="h1"
                textAlign="center"
                style={{ color: "#2985d0", marginTop: "10px" }}
              >
                Identification of the Beneficial Owner
              </Header>
              <Header as="h3" textAlign="center" style={{ marginBottom: 20 }}>
                If the deposited assets are credited to you economically, agree
                with signing the checkbox below
              </Header>
              <Container textAlign="center">
                <Divider />
                <Checkbox
                  label="I agree that I am the sole beneficial owner of the assets"
                  required
                  checked={this.state.checkedAssets1}
                  onChange={this.handleCheckAssets1}
                />
                {this.state.checkedAssets1 ? (
                  <Icon
                    name="check circle"
                    color="green"
                    size="large"
                    style={{ float: "right" }}
                  />
                ) : null}
                <Divider />
                <Checkbox
                  label="I agree that the following persons are beneficial owners of the assets"
                  required
                  checked={this.state.checkedAssets2}
                  onChange={this.handleCheckAssets2}
                />
                {this.state.checkedAssets2 ? (
                  <Icon
                    name="check circle"
                    color="green"
                    size="large"
                    style={{ float: "right" }}
                  />
                ) : null}
                <Divider />
                {/* open form when checkbox 2 is checked */}
                {this.state.checkedAssets2 ? (
                  <div style={{ marginBottom: "10px" }}>
                    <Segment style={{ textAlign: "left" }}>
                      <p
                        style={{
                          fontWeight: "bold",
                          fontWeight: "900",
                          fontSize: "17px",
                          borderRadius: "100%",
                          display: "inline",
                          paddingLeft: "6px",
                          paddingRight: "7px",
                          backgroundColor: "black",
                          color: "white"
                        }}
                      >
                        {/* Form to get all beneficial owners */}1
                      </p>
                      <Form
                        onSubmit={this.ownerFormSubmit}
                        style={{ marginTop: "1%" }}
                      >
                        <Segment>
                          <Form.Group widths="equal">
                            <Form.Input
                              fluid
                              label="First Name"
                              placeholder="First Name"
                              required
                              name="ownerFname"
                              value={this.state.ownerFname}
                              onChange={event =>
                                this.setState({
                                  ownerFname: event.target.value
                                })
                              }
                            />
                            <Form.Input
                              fluid
                              label="Last Name"
                              placeholder="Last Name"
                              required
                              name="ownerlastName"
                              value={this.state.ownerLname}
                              onChange={event =>
                                this.setState({
                                  ownerLname: event.target.value
                                })
                              }
                            />
                          </Form.Group>
                          <Form.Group>
                            <Form.Input
                              width="eleven"
                              fluid
                              label="Street"
                              placeholder="Street"
                              required
                              name="ownerStreet"
                              value={this.state.ownerStreet}
                              onChange={event =>
                                this.setState({
                                  ownerStreet: event.target.value
                                })
                              }
                            />
                            <Form.Input
                              width="five"
                              fluid
                              label="House Number"
                              required
                              placeholder="House Number"
                              name="ownerHouseNr"
                              value={this.state.ownerHouseNr}
                              onChange={event =>
                                this.setState({
                                  ownerHouseNr: event.target.value
                                })
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
                              name="ownerPostCode"
                              value={this.state.ownerPostCode}
                              onChange={event =>
                                this.setState({
                                  ownerPostCode: event.target.value
                                })
                              }
                            />
                            <Form.Input
                              width="ten"
                              fluid
                              label="Place of Residenz"
                              required
                              placeholder="Place of Residence"
                              name="ownerPlaceOfRes"
                              value={this.state.ownerPlaceOfRes}
                              onChange={event =>
                                this.setState({
                                  ownerPlaceOfRes: event.target.value
                                })
                              }
                            />
                          </Form.Group>
                          <Form.Group widths="equal">
                            <Form.Input
                              fluid
                              label="Date of Birth"
                              required
                              placeholder="DD.MM.YYYY"
                              name="ownerDateOfBirth"
                              value={this.state.ownerDateOfBirth}
                              onChange={event =>
                                this.setState({
                                  ownerDateOfBirth: event.target.value
                                })
                              }
                            />
                          </Form.Group>
                        </Segment>
                        <Segment style={{ textAlign: "left", marginTop: "1%" }}>
                          <p
                            style={{
                              fontWeight: "bold",
                              fontWeight: "900",
                              fontSize: "17px",
                              borderRadius: "100%",
                              display: "inline",
                              paddingLeft: "6px",
                              paddingRight: "7px",
                              backgroundColor: "black",
                              color: "white"
                            }}
                          >
                            2
                          </p>
                          <Form.Group widths="equal">
                            <Form.Input
                              fluid
                              label="First Name"
                              placeholder="First Name"
                              name="ownerFname2"
                              value={this.state.ownerFname2}
                              onChange={event =>
                                this.setState({
                                  ownerFname2: event.target.value
                                })
                              }
                            />
                            <Form.Input
                              fluid
                              label="Last Name"
                              placeholder="Last Name"
                              name="ownerLname2"
                              value={this.state.ownerLname2}
                              onChange={event =>
                                this.setState({
                                  ownerLname2: event.target.value
                                })
                              }
                            />
                          </Form.Group>
                          <Form.Group>
                            <Form.Input
                              width="eleven"
                              fluid
                              label="Street"
                              placeholder="Street"
                              name="ownerStreet2"
                              value={this.state.ownerStreet2}
                              onChange={event =>
                                this.setState({
                                  ownerStreet2: event.target.value
                                })
                              }
                            />
                            <Form.Input
                              width="five"
                              fluid
                              label="House Number"
                              placeholder="House Number"
                              name="ownerHouseNr2"
                              value={this.state.ownerHouseNr2}
                              onChange={event =>
                                this.setState({
                                  ownerHouseNr2: event.target.value
                                })
                              }
                            />
                          </Form.Group>
                          <Form.Group>
                            <Form.Input
                              width="six"
                              fluid
                              type="number"
                              label="Postal Code"
                              placeholder="Postal Code"
                              name="ownerPostCode2"
                              value={this.state.ownerPostCode2}
                              onChange={event =>
                                this.setState({
                                  ownerPostCode2: event.target.value
                                })
                              }
                            />
                            <Form.Input
                              width="ten"
                              fluid
                              label="Place of Residenz"
                              placeholder="Place of Residence"
                              name="ownerPlaceOfRes2"
                              value={this.state.ownerPlaceOfRes2}
                              onChange={event =>
                                this.setState({
                                  ownerPlaceOfRes2: event.target.value
                                })
                              }
                            />
                          </Form.Group>
                          <Form.Group widths="equal">
                            <Form.Input
                              fluid
                              label="Date of Birth"
                              placeholder="DD.MM.YYYY"
                              name="ownerDateOfBirth2"
                              value={this.state.ownerDateOfBirth2}
                              onChange={event =>
                                this.setState({
                                  ownerDateOfBirth2: event.target.value
                                })
                              }
                            />
                          </Form.Group>
                        </Segment>
                        <Segment style={{ textAlign: "left", marginTop: "1%" }}>
                          <p
                            style={{
                              fontWeight: "bold",
                              fontWeight: "900",
                              fontSize: "17px",
                              borderRadius: "100%",
                              display: "inline",
                              paddingLeft: "6px",
                              paddingRight: "7px",
                              backgroundColor: "black",
                              color: "white"
                            }}
                          >
                            3
                          </p>
                          <Form.Group widths="equal">
                            <Form.Input
                              fluid
                              label="First Name"
                              placeholder="First Name"
                              name="ownerFname3"
                              value={this.state.ownerFname3}
                              onChange={event =>
                                this.setState({
                                  ownerFname3: event.target.value
                                })
                              }
                            />
                            <Form.Input
                              fluid
                              label="Last Name"
                              placeholder="Last Name"
                              name="ownerLname3"
                              value={this.state.ownerLname3}
                              onChange={event =>
                                this.setState({
                                  ownerLname3: event.target.value
                                })
                              }
                            />
                          </Form.Group>
                          <Form.Group>
                            <Form.Input
                              width="eleven"
                              fluid
                              label="Street"
                              placeholder="Street"
                              name="ownerStreet3"
                              value={this.state.ownerStreet3}
                              onChange={event =>
                                this.setState({
                                  ownerStreet3: event.target.value
                                })
                              }
                            />
                            <Form.Input
                              width="five"
                              fluid
                              label="House Number"
                              placeholder="House Number"
                              name="ownerHouseNr3"
                              value={this.state.ownerHouseNr3}
                              onChange={event =>
                                this.setState({
                                  ownerHouseNr3: event.target.value
                                })
                              }
                            />
                          </Form.Group>
                          <Form.Group>
                            <Form.Input
                              width="six"
                              fluid
                              type="number"
                              label="Postal Code"
                              placeholder="Postal Code"
                              name="ownerPostCode3"
                              value={this.state.ownerPostCode3}
                              onChange={event =>
                                this.setState({
                                  ownerPostCode3: event.target.value
                                })
                              }
                            />
                            <Form.Input
                              width="ten"
                              fluid
                              label="Place of Residenz"
                              placeholder="Place of Residence"
                              name="ownerPlaceOfRes3"
                              value={this.state.ownerPlaceOfRes3}
                              onChange={event =>
                                this.setState({
                                  ownerPlaceOfRes3: event.target.value
                                })
                              }
                            />
                          </Form.Group>
                          <Form.Group widths="equal">
                            <Form.Input
                              fluid
                              label="Date of Birth"
                              placeholder="DD.MM.YYYY"
                              name="ownerDateOfBirth3"
                              value={this.state.ownerDateOfBirth3}
                              onChange={event =>
                                this.setState({
                                  ownerDateOfBirth3: event.target.value
                                })
                              }
                            />
                          </Form.Group>
                        </Segment>
                        <Container style={{ display: "inline-block" }}>
                          <Button
                            primary
                            icon
                            floated="right"
                            labelPosition="right"
                          >
                            Next
                            <Icon name="right arrow" />
                          </Button>
                        </Container>
                      </Form>
                    </Segment>
                  </div>
                ) : null}
              </Container>
              <Container style={{ display: "inline-block" }}>
                {this.state.checkedAssets1 ? (
                  <Button
                    primary
                    icon
                    floated="right"
                    labelPosition="right"
                    onClick={() => this.setState({ terms: true, pay: false })}
                  >
                    Next
                    <Icon name="right arrow" />
                  </Button>
                ) : !this.state.checkedAssets1 && !this.state.checkedAssets2 ? (
                  <Button
                    primary
                    icon
                    floated="right"
                    labelPosition="right"
                    disabled
                  >
                    Next
                    <Icon name="right arrow" />
                  </Button>
                ) : null}
              </Container>
            </Segment>
          ) : // Terms & Conditions view
          this.state.terms == true && this.state.pay == false ? (
            <Segment style={{ marginTop: "50px" }}>
              <br />
              <Header
                as="h1"
                textAlign="center"
                style={{ color: "#2985d0", marginTop: "10px" }}
              >
                Terms and Conditions
              </Header>
              <Header as="h3" textAlign="center" style={{ marginBottom: 20 }}>
                Make sure you accept all terms and conditions
              </Header>
              <Container textAlign="center">
                <Checkbox
                  label="I agree to conduct the video identification"
                  required
                  checked={this.state.checked1}
                  onClick={() =>
                    this.setState({ checked1: !this.state.checked1 })
                  }
                />
                {this.state.checked1 ? (
                  <Icon
                    name="check circle"
                    color="green"
                    size="large"
                    style={{ float: "right" }}
                  />
                ) : null}
                <Divider />
                <Checkbox
                  label="I agree that the audio line is beeing recorded"
                  required
                  checked={this.state.checked2}
                  onClick={() =>
                    this.setState({ checked2: !this.state.checked2 })
                  }
                />
                {this.state.checked2 ? (
                  <Icon
                    name="check circle"
                    color="green"
                    size="large"
                    style={{ float: "right" }}
                  />
                ) : null}
                <Divider />
                <Checkbox
                  label="I confirm to have my identity card ready"
                  required
                  checked={this.state.checked3}
                  onClick={() =>
                    this.setState({ checked3: !this.state.checked3 })
                  }
                />
                {this.state.checked4 ? (
                  <Icon
                    name="check circle"
                    color="green"
                    size="large"
                    style={{ float: "right" }}
                  />
                ) : null}
                <Divider />
                <Checkbox
                  label="I confirm that I have a good internet connection"
                  required
                  checked={this.state.checked4}
                  onClick={() =>
                    this.setState({ checked4: !this.state.checked4 })
                  }
                />
                {this.state.checked4 ? (
                  <Icon
                    name="check circle"
                    color="green"
                    size="large"
                    style={{ float: "right" }}
                  />
                ) : null}
                <Divider />
                <Checkbox
                  label="I confirm that I am in a silent environment"
                  required
                  checked={this.state.checked5}
                  onClick={() =>
                    this.setState({ checked5: !this.state.checked5 })
                  }
                />
                {this.state.checked5 ? (
                  <Icon
                    name="check circle"
                    color="green"
                    size="large"
                    style={{ float: "right" }}
                  />
                ) : null}
                <Divider />
                <Checkbox
                  label="I confirm that I have a good microphone (preferably headset)"
                  required
                  checked={this.state.checked6}
                  onClick={() =>
                    this.setState({ checked6: !this.state.checked6 })
                  }
                />
                {this.state.checked6 ? (
                  <Icon
                    name="check circle"
                    color="green"
                    size="large"
                    style={{ float: "right" }}
                  />
                ) : null}
                <Divider />
                <Checkbox
                  label="I agree to pay a fee for the video identification"
                  required
                  checked={this.state.checked7}
                  onClick={() =>
                    this.setState({ checked7: !this.state.checked7 })
                  }
                />
                {this.state.checked7 ? (
                  <Icon
                    name="check circle"
                    color="green"
                    size="large"
                    style={{ float: "right" }}
                  />
                ) : null}
                {/* Check if all checkboxes are checked to enable the next button */}
                <Divider />
                {this.state.checked1 &&
                this.state.checked2 &&
                this.state.checked3 &&
                this.state.checked4 &&
                this.state.checked5 &&
                this.state.checked6 &&
                this.state.checked7 ? (
                  <Container style={{ display: "inline-block" }}>
                    <Button
                      icon
                      labelPosition="left"
                      floated="left"
                      onClick={() =>
                        this.setState({ terms: false, pay: false })
                      }
                    >
                      <Icon name="left arrow" />
                      Back
                    </Button>
                    <Button
                      primary
                      labelPosition="right"
                      floated="right"
                      icon
                      onClick={() => this.setState({ pay: true })}
                    >
                      Next <Icon name="right arrow" />
                    </Button>
                  </Container>
                ) : (
                  <Container style={{ display: "inline-block" }}>
                    <Button
                      icon
                      labelPosition="left"
                      floated="left"
                      onClick={() =>
                        this.setState({ terms: false, pay: false })
                      }
                      style={{ display: "inline-block" }}
                    >
                      <Icon name="left arrow" />
                      Back
                    </Button>
                    <Button
                      primary
                      labelPosition="right"
                      floated="right"
                      icon
                      disabled
                      onClick={() => this.setState({ pay: true })}
                    >
                      Next <Icon name="right arrow" />
                    </Button>
                  </Container>
                )}
              </Container>
            </Segment>
          ) : //Payment view
          this.state.terms == true && this.state.pay == true ? (
            <div>
              <Segment
                style={{
                  marginTop: "50px"
                }}
              >
                <Header
                  as="h1"
                  textAlign="center"
                  style={{ marginTop: "10px", color: "#2985d0" }}
                >
                  Payment
                </Header>
                <Header as="h3" textAlign="center" style={{ marginBottom: 20 }}>
                  Please enter a value you are willing to pay
                </Header>
                {this.state.metaMask == false ? (
                  <Message error content="Please login to Metamask" />
                ) : null}
                {this.state.waitingForTransactionSuccess == true ? (
                  <Message
                    warning
                    content="waiting for transaction success..."
                  />
                ) : null}
                {/* Enter ether value to send */}
                <Form onSubmit={this.submit} error={this.state.error}>
                  <Form.Field>
                    <Form.Input
                      readOnly={this.state.metaMask == false}
                      icon="ethereum"
                      iconPosition="left"
                      placeholder="Ether"
                      id="etherValue"
                      type="number"
                      min="0"
                      step="0.0001"
                      value={this.state.etherValue}
                      onChange={event =>
                        this.setState({ etherValue: event.target.value })
                      }
                    />
                  </Form.Field>
                  <Message
                    error
                    header="Oops!"
                    content="Please enter a value"
                  />
                  <Button
                    disabled={this.state.metaMask == false}
                    fluid
                    icon
                    size="large"
                    color="blue"
                    loading={this.state.loading}
                  >
                    <Icon name="check circle outline" size="large" />
                  </Button>
                </Form>
                <Button
                  style={{ backgroundColor: "white" }}
                  fluid
                  onClick={() => this.setState({ terms: true, pay: false })}
                >
                  <Icon name="arrow left" /> back
                </Button>
              </Segment>
            </div>
          ) : null}
        </Layout>
      </div>
    );
  }
}

export default Assets;
