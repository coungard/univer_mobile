/**
 * @format
 */

// Must be the first import — react-native-gesture-handler patches native module registration
// that React Navigation's native-stack relies on. See https://reactnavigation.org/docs/getting-started.
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
