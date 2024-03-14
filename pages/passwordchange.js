import React, { Component } from "react";
import { Link, Router } from "../routes";
import {
  Button,
  Icon,
  Segment,
  Form,
  Message,
  Header,
  Popup
} from "semantic-ui-react";
import Layout from "../components/Layout";
import axios from "axios";
import swal from "sweetalert2";
import jwtDecode from "jwt-decode";

class PwChange extends Component {
  constructor() {
    super();
    this.state = {
      errorMessage: ""
    };
  }

  //decode token in link to receive username
  componentDidMount() {
    let token = window.location.pathname.split("/");
    let decoded = jwtDecode(token[2]);
    this.setState({ username: decoded.username });
  }

  //send new password to server
  confirmPassword = async () => {
    //check if both passwords match
    if (this.state.password == this.state.confirmedPassword) {
      const formData = new FormData();
      formData.append("password", this.state.password);
      formData.append("username", this.state.username);

      this.setState({ loading: true });

      try {
        const res = await axios.post(
          window.location.origin + "/changepw",
          formData
        );
        if (res.data.success) {
          swal(
            "Congratulations!",
            "Your password has been changed!",
            "success"
          );
          Router.push("/login");
        } else {
          this.setState({ errorMessage: res.data.message });
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      this.setState({
        errorMessage: "Passwords are not the same!"
      });
    }

    this.setState({ loading: false });
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
          <Segment
            style={{ maxWidth: "450px", margin: "auto", marginTop: "50px" }}
          >
            <br />
            <Header
              as="h1"
              textAlign="center"
              style={{ color: "#2985d0", marginTop: "10px" }}
            >
              Password Reset
            </Header>
            <Header as="h3" textAlign="center" style={{ marginBottom: 20 }}>
              Please enter your username and select a new password and confirm
              it
            </Header>
            <Popup
              trigger={
                <Icon
                  name="question circle outline"
                  style={{ marginBottom: "8px" }}
                />
              }
              content="The password must contain at least 1 upper case letter, 1 lower case letter, 1 digit, 1 special character and minimum eight in length!"
              hideOnScroll
            />
            {/* Form to handle input */}
            <Form
              onSubmit={this.confirmPassword}
              error={this.state.errorMessage}
            >
              <Form.Field>
                <Form.Input
                  icon="lock"
                  iconPosition="left"
                  type="password"
                  placeholder="Password"
                  //strong password required
                  pattern="^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$"
                  name="password"
                  value={this.state.password}
                  onChange={event =>
                    this.setState({ password: event.target.value })
                  }
                />
              </Form.Field>
              <Form.Field>
                <Form.Input
                  width="sixteen"
                  icon="lock"
                  iconPosition="left"
                  type="password"
                  placeholder="Confirm Password"
                  name="confirmedPassword"
                  value={this.state.confirmedPassword}
                  onChange={event =>
                    this.setState({ confirmedPassword: event.target.value })
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
                Confirm
              </Button>
            </Form>
          </Segment>
        </Layout>
      </div>
    );
  }
}

export default PwChange;
