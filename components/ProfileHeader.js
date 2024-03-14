import React, { Component } from "react";
import { Menu, Icon } from "semantic-ui-react";
import { setCookie } from "../utils/CookieUtils";
import { Router, Link } from "../routes";
import axios from "axios";
import Layout from "./Layout";

export default class ProfileHeader extends Component {
  constructor() {
    super();
    this.state = {
      currentUser: ""
    };
  }

  //get current user to display
  async componentDidMount() {
    try {
      const response = await axios.post(
        window.location.origin + "/currentuser"
      );
      if (response.data.success) {
        this.setState({ currentUser: response.data.currentUser });
      }
    } catch (err) {
      console.log(err);
    }
  }

  //on logout, delete cookies
  //redirect user to login page
  logout = () => {
    setCookie("x-access-token", "", -60 * 60);
    Router.pushRoute("/login");
    window.location.href = "/login";
  };

  render() {
    return (
      <div>
        <Menu pointing>
          <Menu.Item name="home">
            <Icon name="home" size="small" />
          </Menu.Item>
          <Menu.Menu position="right">
            <Menu.Item name="logout" onClick={this.logout} />
            <Menu.Item>
              <Icon name="user" size="small" />
              <p>{this.state.currentUser}</p>
            </Menu.Item>
          </Menu.Menu>
        </Menu>
        <Layout>
          <style jsx global>{`
            body {
              background: #e6e6e6;
            }
          `}</style>
        </Layout>
      </div>
    );
  }
}
