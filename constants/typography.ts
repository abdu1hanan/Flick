import { TextStyle } from 'react-native';

export const Fonts = {
  pixel: 'PixelifySans_700Bold',
  pixelSemi: 'PixelifySans_600SemiBold',
  pixelRegular: 'PixelifySans_400Regular',
  manropeRegular: 'Manrope_400Regular',
  manropeMedium: 'Manrope_500Medium',
  manropeSemi: 'Manrope_600SemiBold',
  manropeBold: 'Manrope_700Bold',
  manropeExtra: 'Manrope_800ExtraBold',
};

export const Typography = {
  heroNumber: {
    fontFamily: Fonts.manropeExtra,
    fontSize: 76,
    fontWeight: '800' as TextStyle['fontWeight'],
    letterSpacing: -3,
  },
  appWordmark: {
    fontFamily: Fonts.pixel,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: Fonts.manropeBold,
    fontSize: 22,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.6,
  },
  sectionHeader: {
    fontFamily: Fonts.manropeSemi,
    fontSize: 14,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: Fonts.manropeRegular,
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  caption: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 12,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: -0.2,
  },
  statValue: {
    fontFamily: Fonts.manropeBold,
    fontSize: 20,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 11,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: -0.2,
  },
  islandText: {
    fontFamily: Fonts.manropeSemi,
    fontSize: 13,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.2,
  },
  buttonText: {
    fontFamily: Fonts.manropeBold,
    fontSize: 15,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.3,
  },
  linkText: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 12,
    textDecorationLine: 'underline' as TextStyle['textDecorationLine'],
    letterSpacing: -0.2,
  },
};
