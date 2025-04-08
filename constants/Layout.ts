import { Dimensions } from 'react-native';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

export default {
  window: {
    width,
    height,
  },
  screen: {
    width,
    height,
  },
  // Padding và margin chuẩn
  padding: {
    container: 20,
    card: 16,
    items: 8,
  },
  margin: {
    container: 20,
    section: 24,
    item: 16,
    elementSpacing: 8,
  },
  border: {
    width: 1,
    radius: {
      small: 6,
      normal: 8,
      large: 12,
      xl: 16,
    }
  },
  card: {
    borderRadius: 12,
    padding: 16,
    margin: 8
  }
};