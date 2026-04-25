import { useSelector } from 'react-redux';
import { themes } from '../theme';

export const useTheme = () => {
  const { theme } = useSelector((state) => state.settings);
  return themes[theme] || themes.dark;
};
