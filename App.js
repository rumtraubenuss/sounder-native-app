import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  TouchableWithoutFeedback,
} from 'react-native';
import Expo, { Audio, AUDIO_RECORDING, Permissions, FileSystem } from 'expo';

export default class App extends React.Component {
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
      this.recording.setOnRecordingStatusUpdate(status => console.log(status));
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

  render() {
    const { isRecording, recordingAvailable, isPlaying } = this.state;

    return (
      <View style={styles.container}>
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
          </View>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

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
