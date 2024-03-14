import React, { Component } from "react";
import Layout from "../components/Layout";
import dynamic from "next/dynamic";

const ProfileHeader = dynamic(import("../components/ProfileHeader"), {
  ssr: false
});

const UserData = dynamic(import("../components/UserData"), {
  ssr: false
});

//render UserData and ProfileHeader components
class Profile extends Component {
  constructor() {
    super();
  }

  render() {
    return (
      <div>
        <ProfileHeader />
        <UserData />
        <Layout>
          <style>{`
        body {
          background: #e6e6e6;
        }
      `}</style>
        </Layout>
      </div>
    );
  }
}

export default Profile;
