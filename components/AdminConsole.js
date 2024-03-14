import React, { Component } from "react";
import MediaHandler from "../webrtc/MediaHandler";
import Pusher from "pusher-js";
import Peer from "simple-peer";
const APP_KEY = "Your Pusher API app key"; //Pusher Key
import { setCookie } from "../utils/CookieUtils";
import { authenticator } from "otplib/otplib-browser";
import { Tesseract } from "tesseract.ts";
const parse = require("mrz").parse;
import RecordRTC from "recordrtc";
const StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
import Carousel from "nuka-carousel";
import ReactCrop from "react-image-crop";
import "!style-loader!css-loader!react-image-crop/dist/ReactCrop.css";
import web3 from "../ethereum/src/web3";
import contract from "../ethereum/src/contract";
import {
  Message,
  Segment,
  Button,
  Icon,
  Container,
  Grid,
  Modal,
  Menu,
  Card,
  Accordion,
  Form
} from "semantic-ui-react";
import axios from "axios";
import { Router } from "../routes";
import swal from "sweetalert2";
import { MultiStreamsMixer } from "multistreamsmixer";
let xsrfToken = "";
let pusher;
let peer;
let channelName;
let userName;
let userNames = [];
let recordRTC;
let firstMember;

//Videochat and User list
export default class AdminConsole extends Component {
  constructor() {
    super();
    this.imageCropPreviewCanvasRef = React.createRef();
    this.state = {
      hasMedia: false,
      userName: "",
      role: 1,
      isNotCalled: "true",
      message: "",
      loading: false,
      isEdited: "",
      activeItem: "videochat",
      ethAddresses: [],
      sent: false,
      idIsValid: "",
      users: [],
      disableButton: true,
      isRecording: "",
      snapshotMessage: "",
      activeItem: "videochat",
      isVideo: true,
      crop: {
        x: 0,
        y: 60,
        width: 100,
        height: 40
      }
    };

    //create object for current user
    this.currentUser = {
      id: "",
      stream: undefined
    };

    this.peers = [];

    this.mediaHandler = new MediaHandler();
  }

  async componentWillMount() {
    //check whether the edit state of users change
    setInterval(async () => {
      try {
        const response = await axios.post(window.location.origin + "/userlist");
        if (response.data.success) {
          this.setState({ users: response.data.userData });
          for (let i = 0; i < this.state.users.length; i++) {
            if (this.state.users[i].edited) {
              this.setState({ isEdited: this.state.users[i].edited });
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
    }, 1000);

    //request current user data from server
    try {
      const response = await axios.post(
        window.location.origin + "/videochat/stream"
      );
      this.setState({
        userName: response.data.currentUser,
        role: response.data.role
      });
      this.currentUser.id = this.state.userName;
      xsrfToken = response.data.token;
    } catch (e) {
      console.log(e);
    }

    //@https://github.com/AfikDeri/laravel-react-webrtc-video-chat
    //ask for permission to allow microphone and webcam
    this.mediaHandler.getPermissions().then(stream => {
      this.setState({ hasMedia: true });
      this.currentUser.stream = stream;
      try {
        let myVideo = document.getElementById("my-video");
        myVideo.srcObject = stream;
        const playPromise = myVideo.play();

        if (playPromise !== null) {
          playPromise
            .then(() => {
              return myVideo.play();
            })
            .catch(e => {
              console.log(e);
            });
        }
      } catch (e) {
        console.log(e.stack);
      }
    });
    this.setupPusher();
    return;
  }

  //@https://github.com/AfikDeri/laravel-react-webrtc-video-chat
  //setting up pusher API
  setupPusher = () => {
    //log pusher to console
    // Pusher.logToConsole = true;
    pusher = new Pusher(APP_KEY, {
      authEndpoint: "/pusher/auth",
      cluster: "e.g. eu",
      auth: {
        params: this.currentUser.id,
        headers: {
          "X-XSRF-Token": xsrfToken
        }
      }
    });

    //create new presence-channel
    channelName = pusher.subscribe("presence-video-channel"); //requires auth

    //get members in channel
    channelName.bind("pusher:subscription_succeeded", members => {
      //get id of Admin from the object
      firstMember = Object.keys(members.members)[0];
    });

    //listener for added members to the channel
    channelName.bind("pusher:member_added", member => {
      swal("You are conneted to", `${member.id}`, "success");
      //push added member into array
      if (userNames.includes(member.id) === false) {
        userNames.push(member.id);
      }
      console.log(userNames);
    });

    //listener for removed members to the channel
    channelName.bind("pusher:member_removed", member => {
      console.log(userName);
      //delete removed member from array
      let i = userNames.indexOf(userName);
      userNames.splice(i, 1);
      console.log(userNames);
      this.setState({
        img1: !this.state.img1,
        showMrzValidationButton: !this.state.showMrzValidationButton,
        disableButton: true,
        disableUserList: false
      });
    });

    //bind client signal to channel
    //this is executed for the callee when the initiator triggers a call
    channelName.bind(`client-signal-${this.currentUser.id}`, signal => {
      let peer = this.peers[signal.userId];
      // if peer does not already exist, we got an incoming call
      if (peer === undefined) {
        //start peer where initiator = false
        peer = this.startPeer(signal.userId, false);
      }
      peer.signal(signal.data);
    });

    //listener for user when declined
    channelName.bind(`client-message-${this.currentUser.id}`, message => {
      //delete cookie and send user to login page
      setCookie("x-access-token", "", -60 * 60);
      window.location.href = "/login";
      Router.push("/login");
    });

    //listener for admin if user has successfully entered otp and ended the process
    channelName.bind(`client-approval-${this.currentUser.id}`, message => {
      swal({
        title: "Success!",
        text: "The user has entered the correct OTP",
        type: "success",
        confirmButtonText: "Confirm",
        //when admin confirms, send audio recording in db
        //hash user data and send to smart contract
        onClose: () => {
          //Stop audio recording and send .wav file to server
          recordRTC.stopRecording(async () => {
            let formData = new FormData();
            let recordedBlob = recordRTC.getBlob();
            console.log(recordedBlob);
            let fileName = `${userName}.wav`;
            //convert recorded blob to a file and send it to the server
            let file = new File([recordedBlob], fileName, {
              mimeType: "audio/wav"
            });
            console.log(file);
            formData.append("fileName", fileName);
            formData.append("file", file);
            formData.append("userName", userName);
            this.setState({ isRecording: "" });
            //get user data from server
            let response = await axios.post(
              window.location.origin + "/approval",
              formData
            );
            if (response.data.success) {
              let accounts = await web3.eth.getAccounts();
              let fname = response.data.fname;
              let lname = response.data.lname;
              let idNum = response.data.idNum;
              let kycKey = response.data.kycKey;
              console.log(fname, lname, idNum, kycKey);
              //hash user data and store in smart contract
              let hash = web3.utils.soliditySha3(
                `${fname} ${lname} ${idNum} ${kycKey}`
              );
              contract.methods.storeHash(hash).send({
                from: accounts[0],
                gas: 200000,
                gasPrice: "5000000000"
              });
            } else {
              console.log("error");
            }
          });
        }
      });
    });
  };

  //@https://github.com/AfikDeri/laravel-react-webrtc-video-chat
  //connect to peer
  startPeer = (userId, initiator = true) => {
    //create new Peer
    peer = new Peer({
      initiator,
      stream: this.currentUser.stream,
      trickle: false
    });

    //log simple-peer to console
    // peer._debug = console.log;

    //sends offer signal to peer
    //connection established when peer sends answer
    peer.on("signal", data => {
      channelName.trigger(`client-signal-${userId}`, {
        type: "signal",
        userId: this.currentUser.id,
        data: data
      });
    });

    //when the connection is established get the peer's audio/video stream
    peer.on("stream", stream => {
      try {
        let userVideo = document.getElementById("user-video");
        userVideo.srcObject = stream;
        const playPromise = userVideo.play();
        if (playPromise !== null) {
          playPromise
            .then(() => {
              return userVideo.play();
            })
            .catch(e => {
              console.log(e);
            });
        }
        //send both streams to MultiStreamsMixer
        let audioMixer = new MultiStreamsMixer([
          this.currentUser.stream,
          stream
        ]);
        //start recording the mixed streams
        recordRTC = RecordRTC(audioMixer.getMixedStream(), {
          recorderType: StereoAudioRecorder,
          mimeType: "audio/wav"
        });
        //start recording
        recordRTC.startRecording();
        this.setState({ isRecording: "Recording..." });
      } catch (e) {
        console.log(e.stack);
      }
    });

    return peer;
  };

  //triggers the call to peer
  callTo = async userId => {
    this.setState({
      isNotCalled: false,
      disableButton: false,
      disableUserList: true
    });
    //start call to userId
    this.peers[userId] = this.startPeer(userId);
    let currentUser = userId;
    console.log(userId);
    //get the peer's data
    let response = await axios.post(
      window.location.origin + "/videochat/user",
      {
        currentUser
      }
    );
    if (response.data.success) {
      this.setState({
        usrs: response.data.userData,
        img1: response.data.img1,
        img2: response.data.img2
      });
    }
    console.log(this.state.img1);
  };

  //decline user while video chat
  decline = async () => {
    this.setState({ declineLoading: true });
    //destroy P2P connection
    peer.destroy();
    //stop audio recording
    recordRTC.stopRecording(async () => {
      let formData = new FormData();
      let recordedBlob = recordRTC.getBlob();
      console.log(recordedBlob);
      let fileName = `${userName}.wav`;
      //convert recorded blob to a file and send it to the server
      let file = new File([recordedBlob], fileName, { mimeType: "audio/wav" });
      console.log(file);
      formData.append("fileName", fileName);
      formData.append("file", file);
      formData.append("userName", userName);
      this.setState({ isRecording: "" });
      let response = await axios.post(
        window.location.origin + "/decline",
        formData
      );
      if (response.data.success) {
        swal("User declined", "", "success");
        //trigger client-event to redirect declined user to login page
        channelName.trigger(`client-message-${userName}`, {
          message: "You have been declined!"
        });
      } else {
        console.log("something went wrong!");
      }
    });
    this.setState({ declineLoading: false });
  };

  //send OTP to server to be sent via email to the user
  sendOTP = async () => {
    this.setState({ loading: true });
    //genereate a otp secret
    let otpSecret = authenticator.generateSecret();
    //generate otp
    let otpToken = authenticator.generate(otpSecret);
    let formData = new FormData();
    formData.append("otpToken", otpToken);
    formData.append("userName", userName);
    let response = await axios.post(
      window.location.origin + "/createOTP",
      formData
    );
    if (response.data.success) {
      swal("OTP sent!", "", "success");
      this.setState({ loading: false });
    } else {
      console.log("error");
    }
  };

  //make optical character recognition (ocr) on the mrz code of the identity card
  //prepare output for mrz scanner
  //scan the mrz code and verify it
  ocrScan = () => {
    this.setState({ loadingOCR: true });
    //get cropped image from canvas
    let image = document.getElementById("mrz-code");
    //use tesseract to read the mrz code
    Tesseract.recognize(image).then((result, err) => {
      if (err) {
        console.log(err);
      }
      let ocrLines = [];
      console.log(this.state.usrs[0].idType);
      if (this.state.usrs[0].idType == "id") {
        //prepare data for identity card mrz verification
        let ocrText1 = JSON.stringify(result.text).substring(1, 31);
        let ocrText2 = JSON.stringify(result.text).substring(33, 63);
        let ocrText3 = JSON.stringify(result.text).substring(65, 95);
        ocrLines.push(ocrText1, ocrText2, ocrText3);
      } else {
        //prepare data for drivers license mrz verification
        let ocrText1 = JSON.stringify(result.text).substring(1, 10);
        let ocrText2 = JSON.stringify(result.text).substring(12, 42);
        let ocrText3 = JSON.stringify(result.text).substring(44, 74);
        ocrLines.push(ocrText1, ocrText2, ocrText3);
      }
      //verify mrz code
      let res = parse(ocrLines);
      if (res.valid === true) {
        this.setState({ idIsValid: true });
      } else {
        this.setState({ idIsValid: false });
      }
      this.setState({
        loadingOCR: false,
        ocr: result.text,
        ocrFormat: res.format
      });
    });
  };

  //handle crop change for first image in carousel
  handleOnCropChange1 = crop => {
    this.setState({ crop: crop });
  };

  //handle image loaded for first image in carousel
  handleImageLoaded1 = image => {
    console.log(image);
  };

  //handle crop complete for first image in carousel
  handleOnCropComplete1 = (crop, pixelCrop) => {
    this.setState({ showMrzValidationButton: true });
    //get canvas, the image and the pixelCrop
    const canvasRef = this.imageCropPreviewCanvasRef.current;
    let image1 = "static/" + this.state.img1;
    //trigger crop function
    this.cropImage(canvasRef, image1, pixelCrop);
  };

  //handle crop change for second image in carousel
  handleOnCropChange2 = crop => {
    this.setState({ crop: crop });
  };

  //handle image loaded for second image in carousel
  handleImageLoaded2 = image => {
    console.log("image");
  };

  //handle crop complete for second image in carousel
  handleOnCropComplete2 = (crop, pixelCrop) => {
    this.setState({ showMrzValidationButton: true });
    //get canvas, the image and the pixelCrop
    const canvasRef = this.imageCropPreviewCanvasRef.current;
    let image2 = "static/" + this.state.img2;
    //trigger crop function
    this.cropImage(canvasRef, image2, pixelCrop);
  };

  //crop image to canvas
  cropImage = (canvasRef, image64, pixelCrop) => {
    const canvas = canvasRef;
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");
    const image = new Image();
    image.src = image64;
    image.onload = function() {
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
    };
  };

  //Set initial Height of Nuka-Carousel to not null
  handleLoadImage = () => {
    this.carouselRef.setDimensions();
  };

  //take snapshot from user-video
  //convert image to Blob and then into a file
  //send file to server
  takeSnapshot = async () => {
    let img = document.getElementById("user-video");
    let canvas = document.getElementById("snapshot");
    let context = canvas.getContext("2d");
    context.drawImage(img, 0, 0, 500, 300);
    //convert image to blob
    canvas.toBlob(async blob => {
      let imageName = `${userName}.png`;
      //convert blob to file
      let image = new File([blob], imageName, {
        mimeType: "image/png"
      });
      //send file to server
      let formData = new FormData();
      formData.append("imageName", imageName);
      formData.append("image", image);
      formData.append("userName", userName);
      let response = await axios.post(
        window.location.origin + "/storeSnapshot",
        formData
      );
      if (response.data.success) {
        console.log("success");
        this.setState({ snapshotMessage: "Snapshot saved!" });
      } else {
        console.log("error");
      }
    });
  };

  //get data of the selected user in the user list
  selectUser = async (member, e, dimmer) => {
    let currentUser = member.username;
    try {
      const response = await axios.post(window.location.origin + "/usrs", {
        currentUser
      });
      if (response.data.success) {
        this.setState({
          usrs: response.data.userData,
          beneficialOwners: response.data.beneficialOwners
        });
        //get Array of ethAddresses
        for (let i = 1; i < this.state.usrs.length; i++) {
          this.state.ethAddresses[i] = this.state.usrs[i].ethAddress;
        }
      }
    } catch (error) {
      console.log(error);
    }
    this.setState({ dimmer, open: true, isChosen: true });
  };

  //close user preview modal
  closeModal = async () => {
    let userName = this.state.usrs[0].username;
    //when closed, change edit state in DB to null
    let response = await axios.post(window.location.origin + "/changeEdit", {
      userName
    });
    if (response.data.success) {
      this.setState({ open: false, ethAddresses: [] });
      let a = false;
      for (let i = 0; i < this.state.users.length; i++) {
        if (!this.state.users[i].edited) {
          this.setState({ isEdited: null });
        }
      }
    }
  };

  //admin accesses user list
  toList = () => {
    this.setState({ isVideo: false, activeItem: "users" });
  };

  //admin accesses video chat
  toVideo = () => {
    this.setState({ isVideo: true, activeItem: "videochat" });
    //get microphone and webcam
    this.mediaHandler.getPermissions().then(stream => {
      this.setState({ hasMedia: true });
      this.currentUser.stream = stream;
      try {
        let myVideo = document.getElementById("my-video");
        myVideo.srcObject = stream;
        const playPromise = myVideo.play();

        if (playPromise !== null) {
          playPromise
            .then(() => {
              return myVideo.play();
            })
            .catch(e => {
              console.log(e);
            });
        }
      } catch (e) {
        console.log(e.stack);
      }
    });
  };

  //open modal when selectUser() is triggered
  show = dimmer => {
    this.setState({ dimmer, open: true });
  };

  //handle accordion to show beneficial owners
  handleAccordionClick = (e, titleProps) => {
    const { index } = titleProps;
    const { activeIndex } = this.state;
    const newIndex = activeIndex === index ? -1 : index;

    this.setState({ activeIndex: newIndex });
  };

  render() {
    const { open, dimmer, activeItem, activeIndex } = this.state;
    return (
      <div>
        <style>{`
        body {
          background: #e6e6e6;
        }
      `}</style>
        {/* menu to switch between videochat and user list */}
        <Menu pointing secondary>
          <Menu.Item
            active={activeItem === "videochat"}
            name="video"
            onClick={this.toVideo}
            style={{ color: "#2985d0" }}
          >
            <Icon name="video" />
            Videochat
          </Menu.Item>
          {this.state.disableUserList ? (
            <Menu.Item
              disabled
              active={activeItem === "users"}
              name="users"
              onClick={this.toList}
              style={{ color: "#2985d0" }}
            >
              <Icon name="users" />
              Userlist
              {this.state.isEdited ? (
                <Icon
                  name="circle thin"
                  size="tiny"
                  color="red"
                  style={{ marginBottom: "10px", marginLeft: "2px" }}
                />
              ) : null}
            </Menu.Item>
          ) : (
            <Menu.Item
              active={activeItem === "users"}
              name="users"
              onClick={this.toList}
              style={{ color: "#2985d0" }}
            >
              <Icon name="users" />
              Userlist
              {this.state.isEdited ? (
                <Icon
                  name="circle thin"
                  size="tiny"
                  color="red"
                  style={{ marginBottom: "10px", marginLeft: "2px" }}
                />
              ) : null}
            </Menu.Item>
          )}
        </Menu>
        {this.state.isVideo ? (
          //videochat view
          <div>
            <Segment style={{ marginTop: "16px", width: "100%" }}>
              <Grid>
                <Grid.Row>
                  <Grid.Column width={8}>
                    {/* video containers */}
                    <Container
                      className="video-container"
                      style={{
                        width: "500px",
                        height: "380px",
                        margin: "0px auto",
                        border: "2px solid black",
                        position: "relative"
                      }}
                    >
                      <video
                        className="my-video"
                        id="my-video"
                        style={{
                          width: "130px",
                          position: "absolute",
                          left: "10px",
                          bottom: "10px",
                          border: "2px solid #0061ff",
                          zIndex: "2"
                        }}
                      />
                      <video
                        className="user-video"
                        id="user-video"
                        style={{
                          position: "absolute",
                          left: "0",
                          right: "0",
                          bottom: "0",
                          top: "0",
                          width: "100%",
                          height: "100%",
                          zIndex: "1"
                        }}
                      />
                    </Container>
                    <br />
                    {/* buttons to take snapshot, send otp and decline user */}
                    <Container style={{ width: "500px", margin: "0px auto" }}>
                      {this.state.disableButton === false ? (
                        <div>
                          <Button
                            animated
                            floated="left"
                            onClick={this.takeSnapshot}
                            style={{
                              backgroundColor: "white",
                              border: "1px solid black",
                              width: "31%"
                            }}
                          >
                            <Button.Content visible>
                              <Icon name="camera" />
                            </Button.Content>
                            <Button.Content hidden>Snapshot</Button.Content>
                          </Button>
                          <Button
                            animated
                            loading={this.state.loading}
                            floated="left"
                            onClick={this.sendOTP}
                            style={{
                              backgroundColor: "white",
                              border: "1px solid black",
                              width: "31%"
                            }}
                          >
                            <Button.Content visible>
                              <Icon name="send" color="green" />
                            </Button.Content>
                            <Button.Content hidden>Send OTP</Button.Content>
                          </Button>
                          <Button
                            animated
                            loading={this.state.declineLoading}
                            floated="left"
                            onClick={this.decline}
                            style={{
                              backgroundColor: "white",
                              border: "1px solid black",
                              width: "31%"
                            }}
                          >
                            <Button.Content visible>
                              <Icon name="close" color="red" />
                            </Button.Content>
                            <Button.Content hidden>Quit Call</Button.Content>
                          </Button>
                          {this.state.isRecording ? (
                            <Icon
                              style={{ display: "inline-block" }}
                              color="red"
                              loading
                              name="spinner"
                            />
                          ) : null}
                          <span style={{ paddingTop: "5px" }}>
                            {this.state.snapshotMessage}
                          </span>
                        </div>
                      ) : (
                        //disable buttons when not in call
                        <div>
                          <Button
                            animated
                            floated="left"
                            onClick={this.takeSnapshot}
                            style={{
                              backgroundColor: "white",
                              border: "1px solid black",
                              width: "31%"
                            }}
                            disabled
                          >
                            <Button.Content visible>
                              <Icon name="camera" />
                            </Button.Content>
                            <Button.Content hidden>Snapshot</Button.Content>
                          </Button>
                          <Button
                            animated
                            floated="left"
                            onClick={this.sendOTP}
                            style={{
                              backgroundColor: "white",
                              border: "1px solid black",
                              width: "31%"
                            }}
                            disabled
                          >
                            <Button.Content visible>
                              <Icon name="send" color="green" />
                            </Button.Content>
                            <Button.Content hidden>Send OTP</Button.Content>
                          </Button>
                          <Button
                            animated
                            floated="left"
                            onClick={this.decline}
                            style={{
                              backgroundColor: "white",
                              border: "1px solid black",
                              width: "31%"
                            }}
                            disabled
                          >
                            <Button.Content visible>
                              <Icon name="close" color="red" />
                            </Button.Content>
                            <Button.Content hidden>Quit Call</Button.Content>
                          </Button>
                          <span>{this.state.isRecording}</span>
                        </div>
                      )}
                    </Container>
                  </Grid.Column>
                  {/* Show identity Card */}
                  {/* Crop image */}
                  <Grid.Column width="eight">
                    {this.state.img1 ? (
                      <div>
                        <Carousel
                          ref={node => {
                            this.carouselRef = node;
                          }}
                          dragging={false}
                          slidesToShow={1}
                          style={{ maxWidth: "451px", margin: "auto" }}
                          renderBottomCenterControls={false}
                        >
                          <div onLoad={this.handleLoadImage}>
                            <ReactCrop
                              style={{
                                width: "451px",
                                height: "287px",
                                margin: "auto"
                              }}
                              src={`../static/${this.state.img1}`}
                              crop={this.state.crop}
                              onChange={this.handleOnCropChange1}
                              onImageLoaded={this.handleImageLoaded1}
                              onComplete={this.handleOnCropComplete1}
                            />
                          </div>
                          <div>
                            <ReactCrop
                              style={{
                                width: "451px",
                                height: "287px",
                                margin: "auto"
                              }}
                              src={`../static/${this.state.img2}`}
                              crop={this.state.crop}
                              onChange={this.handleOnCropChange2}
                              onImageLoaded={this.handleImageLoaded2}
                              onComplete={this.handleOnCropComplete2}
                            />
                          </div>
                        </Carousel>
                        {this.state.showMrzValidationButton ? (
                          <Container style={{ textAlign: "center" }}>
                            <Button
                              onClick={this.ocrScan}
                              loading={this.state.loadingOCR}
                            >
                              Validate MRZ Code
                            </Button>
                          </Container>
                        ) : null}
                        <br />
                        <canvas
                          id="mrz-code"
                          ref={this.imageCropPreviewCanvasRef}
                          style={{
                            width: "300%",
                            display: "none"
                          }}
                        />
                        {/* message when identity card is valid */}
                        {this.state.idIsValid ? (
                          <Message
                            header={`Valid! Type: ${this.state.ocrFormat}`}
                            success
                            content={this.state.ocr}
                            style={{
                              width: "75%",
                              marginLeft: "12.5%",
                              boxShadow: "1px 1px 11px green",
                              border: "1px solid green"
                            }}
                          />
                        ) : this.state.idIsValid === false ? (
                          <Message
                            header={`Not Valid! Type: ${this.state.ocrFormat}`}
                            success
                            content={this.state.ocr}
                            style={{
                              boxShadow: "1px 1px 11px red",
                              border: "1px solid red"
                            }}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  {/* Map all connected users with buttons to call them */}
                  <Grid.Column width="eight">
                    <Container
                      style={{
                        width: "500px",
                        margin: "0px auto"
                      }}
                    >
                      {userNames.map(userId => {
                        return this.currentUser.id !== userId &&
                          userNames != [] ? (
                          <Button
                            key={userId}
                            animated
                            floated="left"
                            key={userId}
                            onClick={() => {
                              this.callTo(userId);
                              userName = userId;
                            }}
                            style={{
                              backgroundColor: "white",
                              border: "1px solid black",
                              width: "31%"
                            }}
                          >
                            <Button.Content visible>
                              Call {userId}
                            </Button.Content>
                            <Button.Content hidden>
                              <Icon name="phone" color="blue" />
                            </Button.Content>
                          </Button>
                        ) : null;
                      })}
                    </Container>
                    <canvas
                      id="snapshot"
                      width="500"
                      height="300"
                      style={{
                        display: "none"
                      }}
                    />
                  </Grid.Column>
                  <Grid.Column width="eight" />
                </Grid.Row>
              </Grid>
            </Segment>
          </div>
        ) : (
          //user list view
          <div>
            {this.state.users.map(member => (
              //when user declined, show red border
              <Card
                key={member.id}
                raised
                style={
                  member.kycKey === "declined"
                    ? {
                        height: "400x",
                        width: "180px",
                        display: "inline-block",
                        margin: "18px",
                        border: "1px solid red"
                      }
                    : {
                        height: "400x",
                        width: "180px",
                        display: "inline-block",
                        margin: "18px"
                      }
                }
              >
                <Card.Content>
                  {/* When user has edited data, show icon */}
                  {member.edited ? (
                    <Icon
                      name="circle thin"
                      size="small"
                      color="red"
                      style={{
                        float: "right",
                        marginRight: "-21px",
                        marginTop: "-19px"
                      }}
                    />
                  ) : null}
                  <Card.Header>
                    {/* when user has done the kyc process, show green checkmar, else show a red x */}
                    {member.username}
                    {member.isRegistered == "yes" ? (
                      <Icon
                        name="checkmark"
                        color="green"
                        style={{ float: "right" }}
                      />
                    ) : (
                      <Icon name="x" color="red" style={{ float: "right" }} />
                    )}
                  </Card.Header>
                  <Card.Meta style={{ marginTop: "2px" }}>
                    <span>Last Modified: {member.lastModified}</span>
                  </Card.Meta>
                  <Card.Description>
                    {member.lname}, {member.fname}
                  </Card.Description>
                </Card.Content>
                <Card.Content extra style={{ textAlign: "center" }}>
                  <Button onClick={this.selectUser.bind(this, member)}>
                    View Profile
                  </Button>
                </Card.Content>
              </Card>
            ))}
            {/* When clicking on a user, open modal containing all information  */}
            {this.state.isChosen ? (
              <Modal dimmer={dimmer} open={open} onClose={this.closeModal}>
                <Modal.Header>
                  Profile of {this.state.usrs[0].username}
                </Modal.Header>
                <Modal.Content image>
                  <Modal.Description>
                    <Form>
                      <div>
                        <Form.Group widths="equal">
                          <Form.Input
                            readOnly
                            fluid
                            label="Username"
                            value={this.state.usrs[0].username}
                          />
                          <Form.Input
                            readOnly
                            fluid
                            label="ID"
                            value={this.state.usrs[0].id}
                          />
                        </Form.Group>
                        <Form.Group widths="equal">
                          <Form.Input
                            readOnly
                            fluid
                            label="First Name"
                            value={this.state.usrs[0].fname}
                          />
                          <Form.Input
                            readOnly
                            fluid
                            label="Last Name"
                            value={this.state.usrs[0].lname}
                          />
                        </Form.Group>
                        {this.state.usrs[0].edited == "address" ? (
                          <div>
                            <Form.Group>
                              <Form.Input
                                error
                                readOnly
                                width="eleven"
                                fluid
                                label="Street"
                                value={this.state.usrs[0].street}
                              />
                              <Form.Input
                                error
                                readOnly
                                width="five"
                                fluid
                                label="House Number"
                                value={this.state.usrs[0].houseNr}
                              />
                            </Form.Group>
                            <Form.Group>
                              <Form.Input
                                error
                                readOnly
                                width="six"
                                fluid
                                type="number"
                                label="Postal Code"
                                value={this.state.usrs[0].postCode}
                              />
                              <Form.Input
                                error
                                readOnly
                                width="ten"
                                fluid
                                label="Place of Residence"
                                value={this.state.usrs[0].placeOfRes}
                              />
                            </Form.Group>
                          </div>
                        ) : (
                          <div>
                            <Form.Group>
                              <Form.Input
                                readOnly
                                width="eleven"
                                fluid
                                label="Street"
                                value={this.state.usrs[0].street}
                              />
                              <Form.Input
                                readOnly
                                width="five"
                                fluid
                                label="House Number"
                                value={this.state.usrs[0].houseNr}
                              />
                            </Form.Group>
                            <Form.Group>
                              <Form.Input
                                readOnly
                                width="six"
                                fluid
                                type="number"
                                label="Postal Code"
                                value={this.state.usrs[0].postCode}
                              />
                              <Form.Input
                                readOnly
                                width="ten"
                                fluid
                                label="Place of Residence"
                                value={this.state.usrs[0].placeOfRes}
                              />
                            </Form.Group>
                          </div>
                        )}
                        <Form.Group widths="equal">
                          <Form.Input
                            readOnly
                            fluid
                            label="Date of Birth"
                            value={this.state.usrs[0].dateOfBirth}
                          />
                          <Form.Input
                            readOnly
                            fluid
                            label="Nationality"
                            value={this.state.usrs[0].nat}
                          />
                        </Form.Group>
                        <Form.Group widths="equal">
                          {this.state.usrs[0].edited == "email" ? (
                            <Form.Input
                              error
                              readOnly
                              fluid
                              label="Email"
                              type="email"
                              value={this.state.usrs[0].email}
                            />
                          ) : (
                            <Form.Input
                              readOnly
                              fluid
                              label="Email"
                              type="email"
                              value={this.state.usrs[0].email}
                            />
                          )}
                          {this.state.usrs[0].edited == "mobNr" ? (
                            <Form.Input
                              error
                              readOnly
                              fluid
                              label="Mobile Number"
                              type="number"
                              value={this.state.usrs[0].mobNr}
                            />
                          ) : (
                            <Form.Input
                              readOnly
                              fluid
                              label="Mobile Number"
                              type="number"
                              value={this.state.usrs[0].mobNr}
                            />
                          )}
                        </Form.Group>
                        <Form.Group width="sixteen">
                          <Form.Input
                            width="sixteen"
                            readOnly
                            fluid
                            label="Registration Date"
                            value={this.state.usrs[0].regDate}
                          />
                        </Form.Group>
                        {this.state.beneficialOwners.length > 0 ? (
                          <Accordion>
                            <Accordion.Title
                              active={activeIndex === 0}
                              index={0}
                              onClick={this.handleAccordionClick}
                              style={{ fontWeight: "bold" }}
                            >
                              <Icon name="dropdown" />
                              Beneficial Owners of the Assets
                            </Accordion.Title>
                            <Accordion.Content active={activeIndex === 0}>
                              {this.state.beneficialOwners.map(
                                beneficialOwner => (
                                  <Segment>
                                    <Form.Group widths="equal">
                                      <Form.Input
                                        readOnly
                                        fluid
                                        label="First Name"
                                        value={beneficialOwner.ownerName}
                                      />
                                      <Form.Input
                                        readOnly
                                        fluid
                                        label="Last Name"
                                        value={beneficialOwner.ownerLastName}
                                      />
                                    </Form.Group>
                                    <Form.Group>
                                      <Form.Input
                                        readOnly
                                        width="eleven"
                                        fluid
                                        label="Street"
                                        value={beneficialOwner.ownerStreet}
                                      />
                                      <Form.Input
                                        readOnly
                                        width="five"
                                        fluid
                                        label="House Number"
                                        value={beneficialOwner.ownerHouseNr}
                                      />
                                    </Form.Group>
                                    <Form.Group>
                                      <Form.Input
                                        readOnly
                                        width="six"
                                        fluid
                                        label="Postal Code"
                                        value={beneficialOwner.ownerPostCode}
                                      />
                                      <Form.Input
                                        readOnly
                                        width="ten"
                                        fluid
                                        label="Place of Residenz"
                                        value={beneficialOwner.ownerPlaceOfRes}
                                      />
                                    </Form.Group>
                                    <Form.Group widths="equal">
                                      <Form.Input
                                        readOnly
                                        fluid
                                        label="Date of Birth"
                                        value={beneficialOwner.ownerDateOfBirth}
                                      />
                                    </Form.Group>
                                  </Segment>
                                )
                              )}
                            </Accordion.Content>
                          </Accordion>
                        ) : null}
                        <br />
                        {/* show all addresses who requested a validation of the user's kycKey */}
                        {this.state.ethAddresses.length > 0 ? (
                          <p style={{ fontWeight: "bold" }}>
                            EthAddresses which requested the KycKey
                          </p>
                        ) : null}

                        {this.state.ethAddresses.map(ethAddress => (
                          <Form.Group width="sixteen">
                            <Form.Input
                              width="sixteen"
                              readOnly
                              fluid
                              value={ethAddress}
                            />
                          </Form.Group>
                        ))}

                        <p style={{ fontWeight: "bold" }}>Identity Card</p>
                        <Form.Group
                          widths="equal"
                          style={{ margin: "0px auto" }}
                        >
                          <a
                            href={`../static/${this.state.usrs[0].ID1}`}
                            target="_blank"
                            style={{ width: "50%" }}
                          >
                            <img
                              className="img-responsive"
                              src={`../static/${this.state.usrs[0].ID1}`}
                              style={{
                                width: "200px",
                                height: "113px"
                                // float: "left"
                              }}
                            />
                          </a>
                          <a
                            href={`../static/${this.state.usrs[0].ID2}`}
                            target="_blank"
                            style={{ width: "50%" }}
                          >
                            <img
                              className="img-responsive"
                              src={`../static/${this.state.usrs[0].ID2}`}
                              style={{
                                width: "200px",
                                height: "113px"
                              }}
                            />
                          </a>
                          {this.state.usrs[0].snapshot ? (
                            <a
                              href={`../static/${this.state.usrs[0].snapshot}`}
                              target="_blank"
                            >
                              <img
                                className="img-responsive"
                                src={`../static/${this.state.usrs[0].snapshot}`}
                                style={{
                                  width: "200px",
                                  height: "113px"
                                }}
                              />
                            </a>
                          ) : null}
                        </Form.Group>
                        <br />
                        <p style={{ fontWeight: "bold" }}>Audio Recording</p>
                        <Form.Group colSpan={2}>
                          <audio controls>
                            <source
                              src={`../static/${this.state.usrs[0].audio}`}
                              type="audio/wav"
                            />
                          </audio>
                        </Form.Group>
                        {this.state.usrs[0].isComp == "1" ? (
                          <div>
                            <Form.Group style={{ marginTop: "10px" }}>
                              {this.state.usrs[0].edited == "compName" ? (
                                <Form.Input
                                  error
                                  readOnly
                                  width="sixteen"
                                  fluid
                                  label="Company Name"
                                  value={this.state.usrs[0].compName}
                                />
                              ) : (
                                <Form.Input
                                  readOnly
                                  width="sixteen"
                                  fluid
                                  label="Company Name"
                                  value={this.state.usrs[0].compName}
                                />
                              )}
                            </Form.Group>
                            {this.state.usrs[0].edited == "compAddress" ? (
                              <div>
                                <Form.Group>
                                  <Form.Input
                                    error
                                    readOnly
                                    width="eleven"
                                    fluid
                                    label="Business Address"
                                    value={this.state.usrs[0].businessAd}
                                  />
                                  <Form.Input
                                    error
                                    readOnly
                                    width="five"
                                    fluid
                                    label="House Number"
                                    value={this.state.usrs[0].compHouseNr}
                                  />
                                </Form.Group>
                                <Form.Group widths="equal">
                                  <Form.Input
                                    error
                                    readOnly
                                    width="six"
                                    fluid
                                    label="Postal Code"
                                    value={this.state.usrs[0].compPostCode}
                                  />
                                  <Form.Input
                                    error
                                    readOnly
                                    width="ten"
                                    fluid
                                    label="Place of Residenz"
                                    value={this.state.usrs[0].residence}
                                  />
                                </Form.Group>
                              </div>
                            ) : (
                              <div>
                                <Form.Group>
                                  <Form.Input
                                    readOnly
                                    width="eleven"
                                    fluid
                                    label="Business Address"
                                    value={this.state.usrs[0].businessAd}
                                  />
                                  <Form.Input
                                    readOnly
                                    width="five"
                                    fluid
                                    label="House Number"
                                    value={this.state.usrs[0].compHouseNr}
                                  />
                                </Form.Group>
                                <Form.Group widths="equal">
                                  <Form.Input
                                    readOnly
                                    width="six"
                                    fluid
                                    label="Postal Code"
                                    value={this.state.usrs[0].compPostCode}
                                  />
                                  <Form.Input
                                    readOnly
                                    width="ten"
                                    fluid
                                    label="Place of Residenz"
                                    value={this.state.usrs[0].residence}
                                  />
                                </Form.Group>
                              </div>
                            )}
                            <Form.Group
                              width="sixteen"
                              style={{ margin: "0px auto" }}
                            >
                              <Icon name="linkify" />
                              <a
                                href={`../static/${this.state.usrs[0].doc1}`}
                                type="application/pdf"
                                target="_blank"
                              >
                                View extract of the relevant registration
                                authority
                              </a>
                            </Form.Group>
                            <Form.Group
                              width="sixteen"
                              style={{ margin: "0px auto" }}
                            >
                              <Icon name="linkify" />
                              <a
                                href={`../static/${this.state.usrs[0].doc2}`}
                                type="application/pdf"
                                target="_blank"
                              >
                                View electronic copy of the power of attorney
                              </a>
                            </Form.Group>
                          </div>
                        ) : null}
                      </div>
                    </Form>
                  </Modal.Description>
                </Modal.Content>
                <Modal.Actions>
                  <Container
                    style={{ textAlign: "center", display: "inline-block" }}
                  >
                    <Button color="black" onClick={this.closeModal}>
                      Close
                    </Button>
                  </Container>
                </Modal.Actions>
              </Modal>
            ) : null}
          </div>
        )}
      </div>
    );
  }
}
