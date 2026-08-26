'use client';

import React from 'react';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '../../../../src/themes/neutral/neutral.css';
import { Theme } from '@astryxdesign/core';
import { neutralTheme } from '../../../../src/themes/neutral/neutral';

export function AstryxThemeProvider({ children }: { children: React.ReactNode }) {
  return <Theme theme={neutralTheme}>{children}</Theme>;
}
