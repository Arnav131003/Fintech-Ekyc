import React, { Component } from "react";
import { Link, Router } from "../routes";
import { Form, Button, Message, Segment, Icon } from "semantic-ui-react";
import { Header } from "semantic-ui-react";
import Layout from "../components/Layout";
import web3 from "../ethereum/src/web3";
import contract from "../ethereum/src/contract";

//validation of kycKey
class Validation extends Component {
  constructor() {
    super();
    this.state = {
      loading: false,
      successMessage: "",
      errorMessage: ""
    };
  }

  //send user back to login page
  backToLogin = () => {
    Router.push("/login");
  };

  //validate kycKey
  handleFormSubmit = () => {
    this.setState({ loading: true, errorMessage: "", successMessage: "" });
    //get user input
    let fname = this.state.fname;
    let lname = this.state.lname;
    let idNum = this.state.idNum;
    let kycKey = this.state.kycKey;

    //get array of hashes from smart contract
    contract.methods
      .getHashes()
      .call()
      .then(result => {
        console.log(result);
        //hash the user data to compare the hash
        let userHash = web3.utils.soliditySha3(
          `${fname} ${lname} ${idNum} ${kycKey}`
        );
        console.log(userHash);
        //check if the user hash is in the array from smart contract
        if (result.includes(userHash) === true) {
          this.setState({ successMessage: "Your KycKey is valid!" });
        } else {
          this.setState({ errorMessage: "Your KycKey is not valid!" });
          console.log(this.state.errorMessage);
        }
      });
    this.setState({ loading: false });
  };

  render() {
    return (
      <div>
        <Layout>
          <Segment
            style={{ maxWidth: "450px", margin: "auto", marginTop: "50px" }}
          >
            <br />
            <Header
              as="h1"
              textAlign="center"
              style={{ color: "#2985d0", marginTop: "10px" }}
            >
              KycKey Validation
            </Header>
            <Header as="h3" textAlign="center" style={{ marginBottom: 20 }}>
              Please provide the information below to validate your KycKey.
            </Header>
            <Header as="h4" textAlign="center" style={{ marginBottom: 20 }}>
              Note: The information must be the same as the as the information
              provided at your registration process
            </Header>
            {/* Form to submit required data */}
            <Form
              onSubmit={this.handleFormSubmit}
              success={this.state.successMessage}
              error={this.state.errorMessage}
            >
              <Form.Field>
                <Form.Input
                  required
                  icon="user"
                  iconPosition="left"
                  placeholder="First Name"
                  name="fname"
                  value={this.state.fname}
                  onChange={event =>
                    this.setState({ fname: event.target.value })
                  }
                />
              </Form.Field>
              <Form.Field>
                <Form.Input
                  required
                  icon="user"
                  iconPosition="left"
                  placeholder="Last Name"
                  name="lname"
                  value={this.state.lname}
                  onChange={event =>
                    this.setState({ lname: event.target.value })
                  }
                />
              </Form.Field>
              <Form.Field>
                <Form.Input
                  required
                  icon="address card"
                  iconPosition="left"
                  placeholder="ID Number"
                  name="idNum"
                  value={this.state.idNum}
                  onChange={event =>
                    this.setState({ idNum: event.target.value })
                  }
                />
              </Form.Field>
              <Form.Field>
                <Form.Input
                  required
                  icon="key"
                  iconPosition="left"
                  placeholder="KycKey"
                  name="kycKey"
                  value={this.state.kycKey}
                  onChange={event =>
                    this.setState({ kycKey: event.target.value })
                  }
                />
              </Form.Field>
              {this.state.errorMessage ? (
                <Message
                  error
                  header="Oops!"
                  content={this.state.errorMessage}
                />
              ) : (
                <Message
                  success
                  header="Success!"
                  content={this.state.successMessage}
                />
              )}
              <Button
                fluid
                icon
                size="large"
                color="blue"
                loading={this.state.loading}
              >
                Validate
                <Icon name="sign-in" />
              </Button>
            </Form>
            <Button
              style={{ backgroundColor: "white" }}
              fluid
              onClick={this.backToLogin}
            >
              <Icon name="arrow left" /> back
            </Button>
          </Segment>
        </Layout>
      </div>
    );
  }
}

export default Validation;
