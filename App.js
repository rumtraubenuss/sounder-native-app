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
import { NativeRouter, Route, Link } from 'react-router-native';

import Record from './Record';

export default class App extends React.Component {
  render() {
    const { match } = this.props;

    return (
      <NativeRouter>
        <View style={styles.container}>
          <Route path="/record" component={Record} />
          <View>
            <Link
              to="/"
              style={styles.navItem}
            >
              <Text>List</Text>
            </Link>
            <Link
              to="/record"
              style={styles.navItem}
            >
              <Text>Record</Text>
            </Link>
          </View>
        </View>
      </NativeRouter>
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

  navItem: {
    marginTop: 12,
    padding: 10,
    backgroundColor: 'grey',
  },
});
