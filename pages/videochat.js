import React, { Component } from "react";
import Layout from "../components/Layout";
import dynamic from "next/dynamic";
const VideoChatUser = dynamic(import("../components/VideoChatUser"), {
  ssr: false
});

//render video chat component of user
export default class VideoChatPage extends Component {
  render() {
    return (
      <div>
        <Layout>
          <VideoChatUser />
        </Layout>
      </div>
    );
  }
}
