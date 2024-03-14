import React, { Component } from "react";
import { Link, Router } from "../routes";
import { Form, Button, Message, Segment, Icon, Grid } from "semantic-ui-react";
import { Header } from "semantic-ui-react";
import Layout from "../components/Layout";
import axios from "axios";
import { setCookie } from "../utils/CookieUtils";

//handle login
class Login extends Component {
  constructor() {
    super();
    this.state = {
      errorMessage: "",
      loading: false
    };
  }

  //send username and pasword to server to check
  login = async () => {
    const formData = new FormData();
    formData.append("username", this.state.username);
    formData.append("password", this.state.password);
    formData.append("errorMessage", this.state.errorMessage);

    this.setState({ loading: true });

    try {
      const res = await axios.post(
        window.location.origin + "/authenticate",
        formData
      );
      //check if the user is declined, admin, registered user or a not registered user
      //set cookies and place corresponding token in it
      if (res.data.success) {
        if (res.data.declined == "declined") {
          this.setState({ errorMessage: res.data.message });
        } else if (
          res.data.registerStatus == "yes" &&
          res.data.privileg == "admin"
        ) {
          setCookie("x-access-token", res.data.adminToken, 1);
          Router.push("/admin");
        } else if (
          res.data.registerStatus == "yes" &&
          res.data.privileg == "user"
        ) {
          setCookie("x-access-token", res.data.userToken, 1);
          Router.push("/profile");
        } else {
          setCookie("x-access-token", res.data.registerToken, 1);
          Router.push("/clickandpay");
        }
      }
    } catch (error) {
      this.setState({
        errorMessage: error.response.data.message
      });
    }

    this.setState({ loading: false });
  };

  render() {
    return (
      <div>
        <Layout>
          <Segment
            style={{
              maxWidth: "450px",
              margin: "auto",
              marginTop: "50px"
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "-50px" }}>
              <Icon
                circular
                name="users"
                size="huge"
                fluid="true"
                color="blue"
              />
            </div>
            <Header
              as="h1"
              textAlign="center"
              style={{ marginTop: 60, color: "#2985d0" }}
            >
              Member Login
            </Header>
            <br />
            {/* Form to handle input */}
            <Form onSubmit={this.login} error={this.state.errorMessage}>
              <Form.Field>
                <Form.Input
                  icon="user"
                  iconPosition="left"
                  placeholder="Username"
                  name="username"
                  value={this.state.username}
                  onChange={event =>
                    this.setState({ username: event.target.value })
                  }
                />
              </Form.Field>
              <Form.Field>
                <Form.Input
                  icon="lock"
                  iconPosition="left"
                  type="password"
                  placeholder="Password"
                  name="password"
                  value={this.state.password}
                  onChange={event =>
                    this.setState({ password: event.target.value })
                  }
                />
              </Form.Field>
              <Message error header="Oops!" content={this.state.errorMessage} />
              <Button
                fluid
                icon
                size="large"
                color="blue"
                loading={this.state.loading}
              >
                Login
                <Icon name="sign-in" />
              </Button>
              <Form.Field>
                {/* Forgot Password Link */}
                <Grid>
                  <Grid.Column
                    width={16}
                    style={{ textAlign: "center", marginTop: "10px" }}
                  >
                    <a href="/passwordreset" style={{ color: "#2985d0" }}>
                      Forgot Password
                    </a>
                  </Grid.Column>
                </Grid>
              </Form.Field>
              <Form.Field>
                {/* KycKey Validation link */}
                <Grid>
                  <Grid.Column width={16} style={{ textAlign: "center" }}>
                    <a href="/validate" style={{ color: "#2985d0" }}>
                      KycKey not working? Validate it!
                    </a>
                  </Grid.Column>
                </Grid>
              </Form.Field>
            </Form>
          </Segment>
          <br />
          {/* Link to registration page */}
          <Message
            style={{
              maxWidth: "450px",
              margin: "auto",
              textAlign: "center",
              backgroundColor: "white"
            }}
          >
            New to us?{" "}
            <a href="/register" style={{ color: "#2985d0" }}>
              Register
            </a>
          </Message>
        </Layout>
      </div>
    );
  }
}

export default Login;
