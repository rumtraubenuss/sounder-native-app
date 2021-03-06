import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  TouchableWithoutFeedback,
} from 'react-native';
import Expo, {
  Audio,
  AUDIO_RECORDING,
  Permissions,
  FileSystem,
  Location,
  Constants,
} from 'expo';

export class Record extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isRecording: false,
      isWaiting: false,
      recordingAvailable: false,
      isPlaying: false,
    }
  }

  componentWillMount() {
    this.prepareRecording();
    console.log('MOUNT')
  }

  async componentWillUnmount() {
    try {
      await this.recording.stopAndUnloadAsync();
    } catch (error) {
      // Do nothing -- we are already unloaded.
    }
  }

  prepareRecording = async () => {
    this.setState({
      isWaiting: true,
      isPlaying: false,
      isRecording: false,
      recordingAvailable: false,
    });
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound.setOnPlaybackStatusUpdate(null);
      this.sound = null;
    }
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      //this.recording.setOnRecordingStatusUpdate(status => console.log(status));
      this.setState({ isWaiting: false });
    } catch (error) {
      console.log(error);
      this.setState({ isWaiting: false });
    }
  }

  async startRecording() {
    await this.recording.startAsync();
    this.setState({ isRecording: true  });
  }

  async stopRecording() {
    this.setState({ isWaiting: true });
    try {
      await this.recording.stopAndUnloadAsync();
    } catch (error) {
      // Do nothing -- we are already unloaded.
    }
    console.log(this.recording.getURI());
    const info = await FileSystem.getInfoAsync(this.recording.getURI());
    console.log(`FILE INFO: ${JSON.stringify(info)}`);
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      playsInSilentLockedModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    });
    const { sound, status } = await this.recording.createNewLoadedSound(
      {
        isLooping: true,
        isMuted: false,
        volume: 1.0,
        rate: 1,
        shouldCorrectPitch: true,
      },
      status => console.log(status)
    );
    this.sound = sound;
    this.setState({ isRecording: false, isWaiting: false, recordingAvailable: true });
  }

  async getLocationAsync() {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      alert('Permission to access location was denied');
    }

    const location = await Location.getCurrentPositionAsync({});
    return location;
  }

  handlePlayClick = async () => {
    if (this.sound) {
      if (this.state.isPlaying) {
        this.setState({ isPlaying: false });
        this.sound.pauseAsync();
      } else {
        this.setState({ isPlaying: true });
        await this.sound.setPositionAsync(0);
        this.sound.playAsync();
      }
    }
  }

  handlePressIn = () => {
    this.startRecording();
  }

  handlePressOut = () => {
    this.stopRecording();
  }

  uploadAudioAsync = async () => {
    const location = await this.getLocationAsync();
    console.log(location);
    const uri = this.recording.getURI();
    console.log("Uploading " + uri);
    //const apiUrl = 'http://192.168.1.15:4000/upload';
    const apiUrl = 'https://sounder-server.herokuapp.com/upload';
    const uriParts = uri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    const formData = new FormData();
    formData.append('latitude', location.coords.latitude);
    formData.append('longitude', location.coords.longitude);
    formData.append('fileType', `audio/x-${fileType}`);
    formData.append('did', Constants.deviceId);
    formData.append('file', {
      uri,
      name: `recording.${fileType}`,
      type: `audio/x-${fileType}`,
    });

    const options = {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    };

    console.log("POSTing " + uri + " to " + apiUrl);
    return fetch(apiUrl, options);
  }

  render() {
    const { isRecording, recordingAvailable, isPlaying } = this.state;
    const { match } = this.props;

    return (
      <View>
        <View>
          {!recordingAvailable &&
              <TouchableWithoutFeedback
                onPressIn={this.handlePressIn}
                onPressOut={this.handlePressOut}
              >
                <View style={styles.buttonStyle}>
                  <Text style={styles.buttonTextStyle}>
                    {isRecording ? 'Stop recording' : 'Start recording'}
                  </Text>
                </View>
              </TouchableWithoutFeedback>
          }
          {recordingAvailable &&
              <View>
                <TouchableHighlight
                  onPress={this.handlePlayClick}
                >
                  <View style={styles.buttonStyle}>
                    <Text style={styles.buttonTextStyle}>
                      {isPlaying ? 'Stop' : 'Play'}
                    </Text>
                  </View>
                </TouchableHighlight>
                <TouchableHighlight
                  onPress={this.prepareRecording}
                >
                  <View style={styles.buttonStyle}>
                    <Text style={styles.buttonTextStyle}>
                      Delete
                    </Text>
                  </View>
                </TouchableHighlight>
                <TouchableHighlight
                  onPress={this.uploadAudioAsync}
                >
                  <View style={styles.buttonStyle}>
                    <Text style={styles.buttonTextStyle}>
                      Upload
                    </Text>
                  </View>
                </TouchableHighlight>
              </View>
          }
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  buttonStyle: {
    width: 200,
    height: 50,
    backgroundColor: 'powderblue',
    justifyContent: 'center',
    alignContent: 'center',
    padding: 10,
  },

  buttonTextStyle: {
    textAlign: 'center',
  },
});

export default Record;
