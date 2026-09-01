'use client';

import React from 'react';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '../../../../src/themes/supabase/supabase.css';
import { Theme } from '@astryxdesign/core';
import { supabaseTheme } from '../../../../src/themes/supabase/supabase';

export function AstryxThemeProvider({ children }: { children: React.ReactNode }) {
  return <Theme theme={supabaseTheme}>{children}</Theme>;
}

