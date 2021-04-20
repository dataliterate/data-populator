import Color from 'color'

export default {
  white: '#ffffff',
  black: '#000000',
  gray50: '#ffffff',
  gray75: '#ffffff',
  gray100: '#ffffff',
  gray200: '#f4f4f4',
  gray300: '#eaeaea',
  gray400: '#d3d3d3',
  gray500: '#bcbcbc',
  gray600: '#959595',
  gray700: '#747474',
  gray800: '#505050',
  gray900: '#323232',

  blue400: '#378ef0',
  blue500: '#2680eb',
  blue600: '#1473e6',
  blue700: '#0d66d0',

  orange500: '#e68619',
  red700: '#c9252d',

  background: '#f7f7f7',
  field: '#cacaca',
  fieldHover: '#b3b3b3',

  alpha: (color, opacity) =>
    Color(color)
      .alpha(opacity / 100)
      .toString()
}
