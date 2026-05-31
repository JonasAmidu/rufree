import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';

registerRootComponent(App);

// Ensure compatibility with environments that expect a 'main' entry
AppRegistry.registerComponent('main', () => App);
