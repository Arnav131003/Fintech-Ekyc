//@https://github.com/AfikDeri/laravel-react-webrtc-video-chat
//function to get the users media
export default class MediaHandler {
  getPermissions() {
    return new Promise((resolve, rej) => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then(stream => {
          resolve(stream);
        })
        .catch(err => {
          throw new Error(`Unable to fetch stream ${err}`);
        });
    });
  }
}
