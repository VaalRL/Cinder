// react-native-web 未附 tsc 可用的型別宣告——此處提供起手所需元件的最小 ambient 宣告。
// 日後上原生（react-native）時，改用真正的 RN 型別（或 @types/react-native + bundler 別名）取代。
declare module "react-native-web" {
  import type { ComponentType, ReactNode } from "react";
  type StyleValue = Record<string, unknown>;
  type Style = StyleValue | Array<StyleValue | false | null | undefined>;

  export interface ViewProps {
    style?: Style;
    children?: ReactNode;
  }
  export interface TextProps {
    style?: Style;
    children?: ReactNode;
  }
  export const View: ComponentType<ViewProps>;
  export const Text: ComponentType<TextProps>;
  export const StyleSheet: {
    create<T extends Record<string, StyleValue>>(styles: T): T;
  };
}
