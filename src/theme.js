import { createTheme } from '@mantine/core';
export const theme = createTheme({
  autoContrast: true,
  primaryColor: 'lime',
  primaryShade: { light: 8, dark: 4 },
  defaultRadius: 'md',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  headings: { fontFamily: "'Segoe UI', system-ui, sans-serif", fontWeight: '750' },
  colors: {
    dark: [
      '#e8eee9',
      '#c4cec6',
      '#a1ada4',
      '#727f76',
      '#435048',
      '#2b3830',
      '#202b24',
      '#151e18',
      '#101712',
      '#0b110d',
    ],
  },
  components: {
    Button: { defaultProps: { size: 'md', radius: 'md' } },
    TextInput: { defaultProps: { size: 'md', radius: 'md' } },
    Textarea: { defaultProps: { size: 'md', radius: 'md' } },
    Select: { defaultProps: { size: 'md', radius: 'md', allowDeselect: false } },
    Modal: {
      defaultProps: {
        centered: true,
        radius: 'lg',
        padding: 'xl',
        overlayProps: { backgroundOpacity: 0.65, blur: 4 },
      },
    },
  },
});
